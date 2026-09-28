-- LIFELINEX POSTGRESQL RLS POLICIES MIGRATION: 002_rls_policies.sql
-- Granular Row Level Security for All Roles

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_bank_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_chain_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_chain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS FOR RLS EVALUATION
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID AS $$
    SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_user_role(target_role user_role_type)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN profiles p ON p.id = ur.profile_id
        WHERE p.auth_user_id = auth.uid() 
          AND (ur.role = target_role OR ur.role IN ('SUPER_ADMIN', 'LIFELINEX_ADMIN'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN profiles p ON p.id = ur.profile_id
        WHERE p.auth_user_id = auth.uid() 
          AND ur.role IN ('SUPER_ADMIN', 'LIFELINEX_ADMIN')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

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

-- 2. PROFILES POLICIES
CREATE POLICY "Profiles viewable by owner or admin"
    ON profiles FOR SELECT
    USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "Profiles updatable by owner or admin"
    ON profiles FOR UPDATE
    USING (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "Profiles insertable on signup"
    ON profiles FOR INSERT
    WITH CHECK (auth_user_id = auth.uid() OR is_admin() OR auth.uid() IS NULL);

-- 3. USER ROLES POLICIES
CREATE POLICY "User roles viewable by self or admin"
    ON user_roles FOR SELECT
    USING (profile_id = current_profile_id() OR is_admin());

CREATE POLICY "User roles manageable by admin only"
    ON user_roles FOR ALL
    USING (is_admin());

-- 4. DONOR PROFILES POLICIES
CREATE POLICY "Donor profile viewable by self or admin or hospital staff"
    ON donor_profiles FOR SELECT
    USING (
        profile_id = current_profile_id() 
        OR is_admin()
        OR has_user_role('HOSPITAL_STAFF')
        OR has_user_role('BLOOD_BANK_STAFF')
    );

CREATE POLICY "Donor profile updatable by self or admin"
    ON donor_profiles FOR UPDATE
    USING (profile_id = current_profile_id() OR is_admin());

CREATE POLICY "Donor profile insertable by self"
    ON donor_profiles FOR INSERT
    WITH CHECK (profile_id = current_profile_id() OR is_admin());

-- 5. HOSPITALS & STAFF
CREATE POLICY "Hospitals publicly viewable"
    ON hospitals FOR SELECT
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "Hospital updates by hospital admin or superadmin"
    ON hospitals FOR UPDATE
    USING (
        is_admin() 
        OR EXISTS (
            SELECT 1 FROM hospital_staff hs 
            WHERE hs.hospital_id = hospitals.id 
              AND hs.profile_id = current_profile_id() 
              AND hs.role = 'HOSPITAL_ADMIN'
        )
    );

CREATE POLICY "Hospital staff viewable by staff of same hospital or admin"
    ON hospital_staff FOR SELECT
    USING (
        is_admin() 
        OR profile_id = current_profile_id()
        OR hospital_id IN (SELECT get_my_hospital_ids())
    );

-- 6. BLOOD BANKS & INVENTORY
CREATE POLICY "Blood banks publicly viewable"
    ON blood_banks FOR SELECT
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "Blood inventory viewable by authenticated users"
    ON blood_inventory FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Blood inventory modifiable by blood bank staff or admin"
    ON blood_inventory FOR ALL
    USING (
        is_admin()
        OR blood_bank_id IN (
            SELECT blood_bank_id FROM blood_bank_staff WHERE profile_id = current_profile_id()
        )
    );

-- 7. BLOOD REQUESTS & DONOR CHAINS
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

CREATE POLICY "Blood requests insertable by hospital staff"
    ON blood_requests FOR INSERT
    WITH CHECK (
        is_admin()
        OR (
            has_user_role('HOSPITAL_STAFF') 
            AND hospital_id IN (SELECT get_my_hospital_ids())
        )
    );

CREATE POLICY "Donor chain members viewable by assigned donor or hospital"
    ON donor_chain_members FOR SELECT
    USING (
        is_admin()
        OR donor_profile_id IN (SELECT id FROM donor_profiles WHERE profile_id = current_profile_id())
        OR EXISTS (
            SELECT 1 FROM donor_chains dc
            JOIN blood_requests br ON br.id = dc.blood_request_id
            WHERE dc.id = donor_chain_members.donor_chain_id
              AND (br.requested_by = current_profile_id() OR br.hospital_id IN (SELECT get_my_hospital_ids()))
        )
    );

CREATE POLICY "Donor chain member status updatable by donor"
    ON donor_chain_members FOR UPDATE
    USING (
        is_admin()
        OR donor_profile_id IN (SELECT id FROM donor_profiles WHERE profile_id = current_profile_id())
    );

-- 8. AMBULANCES & TRACKING
CREATE POLICY "Ambulance viewable by authenticated users"
    ON ambulances FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Ambulance updates by driver or provider admin"
    ON ambulances FOR UPDATE
    USING (
        is_admin()
        OR id IN (SELECT assigned_ambulance_id FROM drivers WHERE profile_id = current_profile_id())
        OR provider_id IN (SELECT provider_id FROM drivers WHERE profile_id = current_profile_id())
    );

CREATE POLICY "Ambulance requests viewable by patient, driver, hospital, admin"
    ON ambulance_requests FOR SELECT
    USING (
        is_admin()
        OR requested_by = current_profile_id()
        OR assigned_driver_id IN (SELECT get_my_driver_ids())
        OR destination_hospital_id IN (SELECT get_my_hospital_ids())
    );

CREATE POLICY "Ambulance locations insertable by assigned driver"
    ON ambulance_locations FOR INSERT
    WITH CHECK (
        is_admin()
        OR driver_id IN (SELECT id FROM drivers WHERE profile_id = current_profile_id())
    );

-- 9. EMERGENCY SESSIONS
CREATE POLICY "Emergencies viewable by patient, hospital, ambulance, admin"
    ON emergency_sessions FOR SELECT
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
        OR assigned_hospital_id IN (SELECT get_my_hospital_ids())
        OR has_user_role('HOSPITAL_STAFF')
        OR has_user_role('AMBULANCE_DRIVER')
    );

CREATE POLICY "Emergencies insertable by patient or admin"
    ON emergency_sessions FOR INSERT
    WITH CHECK (
        patient_profile_id = current_profile_id() OR is_admin()
    );

CREATE POLICY "Emergencies updatable by patient, hospital, ambulance, admin"
    ON emergency_sessions FOR UPDATE
    USING (
        is_admin()
        OR patient_profile_id = current_profile_id()
        OR assigned_hospital_id IN (SELECT hospital_id FROM hospital_staff WHERE profile_id = current_profile_id())
        OR has_user_role('HOSPITAL_STAFF')
    );

-- 10. NOTIFICATIONS
CREATE POLICY "Notifications viewable only by recipient"
    ON notifications FOR SELECT
    USING (recipient_id = current_profile_id() OR is_admin());

CREATE POLICY "Notifications updatable by recipient"
    ON notifications FOR UPDATE
    USING (recipient_id = current_profile_id() OR is_admin());

-- 11. AUDIT LOGS
CREATE POLICY "Audit logs viewable by admin only"
    ON audit_logs FOR SELECT
    USING (is_admin());

CREATE POLICY "Audit logs insertable by system or authenticated user"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL OR is_admin());
