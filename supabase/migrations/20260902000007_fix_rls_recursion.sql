-- LIFELINEX POSTGRESQL SCHEMA MIGRATION: 007_fix_rls_recursion.sql
-- Resolves PostgreSQL infinite recursion error (42P17) on hospital_staff and cross-tenant policies

CREATE OR REPLACE FUNCTION get_my_hospital_ids()
RETURNS SETOF UUID AS $$
    SELECT hospital_id FROM hospital_staff WHERE profile_id = current_profile_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_blood_bank_ids()
RETURNS SETOF UUID AS $$
    SELECT blood_bank_id FROM blood_bank_staff WHERE profile_id = current_profile_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_driver_ids()
RETURNS SETOF UUID AS $$
    SELECT id FROM drivers WHERE profile_id = current_profile_id();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Fix hospital_staff policy
DROP POLICY IF EXISTS "Hospital staff viewable by staff of same hospital or admin" ON hospital_staff;
CREATE POLICY "Hospital staff viewable by staff of same hospital or admin"
    ON hospital_staff FOR SELECT
    USING (
        is_admin() 
        OR profile_id = current_profile_id()
        OR hospital_id IN (SELECT get_my_hospital_ids())
    );

-- 2. Fix emergency_sessions policy
DROP POLICY IF EXISTS "Emergencies viewable by patient, hospital, ambulance, admin" ON emergency_sessions;
CREATE POLICY "Emergencies viewable by patient, hospital, ambulance, admin"
    ON emergency_sessions FOR SELECT
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
        OR assigned_hospital_id IN (SELECT get_my_hospital_ids())
        OR has_user_role('HOSPITAL_STAFF')
        OR has_user_role('AMBULANCE_DRIVER')
    );

-- 3. Fix blood_requests policy
DROP POLICY IF EXISTS "Blood requests viewable by hospital, donors, and admins" ON blood_requests;
CREATE POLICY "Blood requests viewable by hospital, donors, and admins"
    ON blood_requests FOR SELECT
    USING (
        is_admin()
        OR requested_by = current_profile_id()
        OR hospital_id IN (SELECT get_my_hospital_ids())
        OR EXISTS (
            SELECT 1 FROM donor_chains dc
            JOIN donor_chain_members dcm ON dcm.donor_chain_id = dc.id
            JOIN donor_profiles dp ON dp.id = dcm.donor_profile_id
            WHERE dc.blood_request_id = blood_requests.id 
              AND dp.profile_id = current_profile_id()
        )
    );

DROP POLICY IF EXISTS "Blood requests insertable by hospital staff" ON blood_requests;
CREATE POLICY "Blood requests insertable by hospital staff"
    ON blood_requests FOR INSERT
    WITH CHECK (
        is_admin()
        OR (
            has_user_role('HOSPITAL_STAFF') 
            AND hospital_id IN (SELECT get_my_hospital_ids())
        )
    );

-- 4. Fix ambulance_requests policy
DROP POLICY IF EXISTS "Ambulance requests viewable by patient, driver, hospital, admin" ON ambulance_requests;
CREATE POLICY "Ambulance requests viewable by patient, driver, hospital, admin"
    ON ambulance_requests FOR SELECT
    USING (
        is_admin()
        OR requested_by = current_profile_id()
        OR assigned_driver_id IN (SELECT get_my_driver_ids())
        OR destination_hospital_id IN (SELECT get_my_hospital_ids())
    );
