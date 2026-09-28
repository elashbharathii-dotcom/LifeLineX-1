-- LIFELINEX POSTGRESQL SCHEMA MIGRATION: 008_pregnancy_and_guardians_schema.sql
-- Pregnancy Care, Guardians, and Pregnancy Health Records with Granular RLS

-- 1. PREGNANCY PROFILES TABLE
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    due_date DATE,
    pregnancy_week INTEGER CHECK (pregnancy_week >= 1 AND pregnancy_week <= 45),
    blood_group blood_group_type,
    risk_level VARCHAR(32) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_profiles_patient ON pregnancy_profiles(patient_profile_id);
CREATE INDEX IF NOT EXISTS idx_pregnancy_profiles_hospital ON pregnancy_profiles(hospital_id);

-- 2. GUARDIANS / EMERGENCY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'PRIMARY' CHECK (priority IN ('PRIMARY', 'SECONDARY')),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    notification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (notification_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guardians_patient ON guardians(patient_profile_id);

-- 3. PREGNANCY HEALTH RECORDS TABLE
CREATE TABLE IF NOT EXISTS pregnancy_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    blood_pressure VARCHAR(32),
    weight_kg NUMERIC(5,2),
    blood_sugar_mg_dL NUMERIC(6,2),
    temperature_c NUMERIC(4,2),
    heart_rate_bpm INTEGER,
    baby_movement_count INTEGER,
    sleep_hours NUMERIC(4,1),
    water_intake_ml INTEGER,
    medication TEXT,
    supplements TEXT,
    symptoms TEXT,
    notes TEXT,
    recorded_by VARCHAR(32) NOT NULL DEFAULT 'PATIENT' CHECK (recorded_by IN ('PATIENT', 'DOCTOR')),
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pregnancy_records_profile ON pregnancy_health_records(profile_id);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE pregnancy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_health_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR PREGNANCY PROFILES
CREATE POLICY "Pregnancy profiles viewable by patient, hospital staff, admin"
    ON pregnancy_profiles FOR SELECT
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
        OR hospital_id IN (SELECT get_my_hospital_ids())
    );

CREATE POLICY "Pregnancy profiles insertable by patient or admin"
    ON pregnancy_profiles FOR INSERT
    WITH CHECK (
        is_admin()
        OR patient_profile_id = current_profile_id()
    );

CREATE POLICY "Pregnancy profiles updatable by patient, hospital staff, admin"
    ON pregnancy_profiles FOR UPDATE
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
        OR hospital_id IN (SELECT get_my_hospital_ids())
    );

CREATE POLICY "Pregnancy profiles deletable by patient or admin"
    ON pregnancy_profiles FOR DELETE
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
    );

-- 6. RLS POLICIES FOR GUARDIANS
CREATE POLICY "Guardians viewable by patient and admin"
    ON guardians FOR SELECT
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
    );

CREATE POLICY "Guardians insertable by patient and admin"
    ON guardians FOR INSERT
    WITH CHECK (
        is_admin()
        OR patient_profile_id = current_profile_id()
    );

CREATE POLICY "Guardians updatable by patient and admin"
    ON guardians FOR UPDATE
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
    );

CREATE POLICY "Guardians deletable by patient and admin"
    ON guardians FOR DELETE
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
    );

-- 7. RLS POLICIES FOR PREGNANCY HEALTH RECORDS
CREATE POLICY "Pregnancy health records viewable by patient and hospital staff"
    ON pregnancy_health_records FOR SELECT
    USING (
        is_admin()
        OR profile_id IN (
            SELECT id FROM pregnancy_profiles 
            WHERE patient_profile_id = current_profile_id()
               OR hospital_id IN (SELECT get_my_hospital_ids())
        )
    );

CREATE POLICY "Pregnancy health records insertable by patient and hospital staff"
    ON pregnancy_health_records FOR INSERT
    WITH CHECK (
        is_admin()
        OR profile_id IN (
            SELECT id FROM pregnancy_profiles 
            WHERE patient_profile_id = current_profile_id()
               OR hospital_id IN (SELECT get_my_hospital_ids())
        )
    );

CREATE POLICY "Pregnancy health records updatable by patient and hospital staff"
    ON pregnancy_health_records FOR UPDATE
    USING (
        is_admin()
        OR profile_id IN (
            SELECT id FROM pregnancy_profiles 
            WHERE patient_profile_id = current_profile_id()
               OR hospital_id IN (SELECT get_my_hospital_ids())
        )
    );

CREATE POLICY "Pregnancy health records deletable by patient or admin"
    ON pregnancy_health_records FOR DELETE
    USING (
        is_admin()
        OR profile_id IN (
            SELECT id FROM pregnancy_profiles 
            WHERE patient_profile_id = current_profile_id()
        )
    );
