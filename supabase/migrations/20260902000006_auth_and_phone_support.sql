-- LIFELINEX POSTGRESQL SCHEMA MIGRATION: 006_auth_and_phone_support.sql
-- Enables Phone-First Registration, OTP Onboarding & RLS for Citizen Role Assignment

-- 1. Make email optional on profiles to support phone-first SMS OTP authentication
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Ensure phone number has a unique constraint if provided
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_phone_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- 3. Ensure auth_user_id references auth.users(id) with CASCADE if the auth schema exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'users'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'profiles_auth_user_id_fkey'
        ) THEN
            ALTER TABLE profiles 
            ADD CONSTRAINT profiles_auth_user_id_fkey 
            FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- 4. RLS: Allow authenticated users without profiles to insert their initial profile
DROP POLICY IF EXISTS "Profiles insertable on signup" ON profiles;
CREATE POLICY "Profiles insertable on signup"
    ON profiles FOR INSERT
    WITH CHECK (
        auth_user_id = auth.uid() 
        OR is_admin() 
        OR auth.uid() IS NULL
    );

-- 5. RLS: Allow newly onboarded users to self-assign only non-privileged roles (PATIENT or DONOR)
DROP POLICY IF EXISTS "User roles insertable on onboarding" ON user_roles;
CREATE POLICY "User roles insertable on onboarding"
    ON user_roles FOR INSERT
    WITH CHECK (
        profile_id = current_profile_id() 
        AND role IN ('PATIENT', 'DONOR')
    );

-- Privileged roles (HOSPITAL_ADMIN, BLOOD_BANK_ADMIN, AMBULANCE_PROVIDER_ADMIN, LIFELINEX_ADMIN, SUPER_ADMIN)
-- remain strictly manageable by admin only per policy 'User roles manageable by admin only'.
