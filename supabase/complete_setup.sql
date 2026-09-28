-- ==========================================
-- FILE: 20260902000001_core_schema.sql
-- ==========================================
-- LIFELINEX POSTGRESQL SCHEMA MIGRATION: 001_core_schema.sql
-- Unified Healthcare + Emergency Coordination Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role_type AS ENUM (
    'PATIENT',
    'DONOR',
    'HOSPITAL_ADMIN',
    'HOSPITAL_STAFF',
    'BLOOD_BANK_ADMIN',
    'BLOOD_BANK_STAFF',
    'AMBULANCE_PROVIDER_ADMIN',
    'AMBULANCE_DRIVER',
    'LIFELINEX_ADMIN',
    'SUPER_ADMIN'
);

CREATE TYPE blood_group_type AS ENUM (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
);

CREATE TYPE blood_component_type AS ENUM (
    'WHOLE_BLOOD', 'PRBC', 'FFP', 'PLATELETS', 'CRYOPRECIPITATE'
);

CREATE TYPE verification_status_type AS ENUM (
    'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'SUSPENDED'
);

CREATE TYPE donor_availability_type AS ENUM (
    'AVAILABLE', 'BUSY', 'TEMPORARILY_UNAVAILABLE', 'PAUSED'
);

CREATE TYPE blood_request_status_type AS ENUM (
    'CREATED', 'SEARCHING', 'MATCHING', 'PARTIALLY_SECURED', 'SECURED', 'FACILITY_CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED'
);

CREATE TYPE donor_chain_status_type AS ENUM (
    'INITIATED', 'DISPATCHING', 'IN_PROGRESS', 'SECURED', 'EXPIRED', 'CANCELLED'
);

CREATE TYPE donor_chain_member_status_type AS ENUM (
    'NOTIFIED', 'ACCEPTED', 'DECLINED', 'TIMED_OUT', 'CONFIRMED_BY_FACILITY', 'COMPLETED', 'NO_SHOW'
);

CREATE TYPE blood_inventory_status_type AS ENUM (
    'AVAILABLE', 'RESERVED', 'UNDER_TESTING', 'QUARANTINED', 'EXPIRED', 'RELEASED', 'DISCARDED'
);

CREATE TYPE ambulance_status_type AS ENUM (
    'AVAILABLE', 'REQUESTED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRANSPORTING', 'COMPLETED', 'OFFLINE'
);

CREATE TYPE emergency_status_type AS ENUM (
    'CREATED', 'LOCATION_CONFIRMED', 'COORDINATING', 'AMBULANCE_REQUESTED', 'AMBULANCE_ASSIGNED', 'AMBULANCE_EN_ROUTE', 'ARRIVED', 'HOSPITAL_COORDINATED', 'BLOOD_SEARCHING', 'RESOURCE_COORDINATED', 'COMPLETED', 'CANCELLED'
);

CREATE TYPE appointment_status_type AS ENUM (
    'REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
);

CREATE TYPE notification_type_enum AS ENUM (
    'EMERGENCY', 'BLOOD_REQUEST', 'DONOR_CHAIN', 'AMBULANCE', 'APPOINTMENT', 'VERIFICATION', 'INVENTORY', 'SECURITY', 'SYSTEM'
);

CREATE TYPE notification_status_enum AS ENUM (
    'CREATED', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'READ'
);

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    date_of_birth DATE,
    blood_group blood_group_type,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    address_line TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    preferred_language VARCHAR(10) DEFAULT 'en',
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    granted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, role)
);

-- 2. DONORS
CREATE TABLE IF NOT EXISTS donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    blood_group blood_group_type NOT NULL,
    availability_status donor_availability_type DEFAULT 'AVAILABLE',
    verification_status verification_status_type DEFAULT 'PENDING',
    last_donation_date DATE,
    total_donations_count INT DEFAULT 0,
    weight_kg NUMERIC(5,2),
    medical_declaration_passed BOOLEAN DEFAULT FALSE,
    privacy_blur_location BOOLEAN DEFAULT TRUE,
    auto_notify_blood_requests BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_profile_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_storage_path TEXT NOT NULL,
    document_hash VARCHAR(64),
    status verification_status_type DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_profile_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
    facility_type VARCHAR(50) NOT NULL, -- 'HOSPITAL' or 'BLOOD_BANK'
    facility_id UUID NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    blood_group blood_group_type NOT NULL,
    component blood_component_type NOT NULL DEFAULT 'WHOLE_BLOOD',
    units_donated NUMERIC(4,2) DEFAULT 1.0,
    donation_date TIMESTAMPTZ NOT NULL,
    certificate_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emergency_phone VARCHAR(50),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    verification_status verification_status_type DEFAULT 'PENDING',
    total_beds INT DEFAULT 100,
    icu_beds_available INT DEFAULT 10,
    total_icu_beds INT DEFAULT 20,
    has_blood_bank BOOLEAN DEFAULT FALSE,
    has_emergency_ward BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL CHECK (role IN ('HOSPITAL_ADMIN', 'HOSPITAL_STAFF')),
    department VARCHAR(100) DEFAULT 'Emergency Care',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, profile_id)
);

-- 4. BLOOD BANKS
CREATE TABLE IF NOT EXISTS blood_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    verification_status verification_status_type DEFAULT 'PENDING',
    low_stock_threshold_units INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blood_bank_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL CHECK (role IN ('BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blood_bank_id, profile_id)
);

CREATE TABLE IF NOT EXISTS blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
    blood_group blood_group_type NOT NULL,
    component blood_component_type NOT NULL,
    units_available INT NOT NULL DEFAULT 0 CHECK (units_available >= 0),
    units_reserved INT NOT NULL DEFAULT 0 CHECK (units_reserved >= 0),
    units_quarantined INT NOT NULL DEFAULT 0 CHECK (units_quarantined >= 0),
    earliest_expiry_date DATE,
    storage_temperature_celsius NUMERIC(4,1) DEFAULT 4.0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blood_bank_id, blood_group, component)
);

CREATE TABLE IF NOT EXISTS blood_inventory_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
    blood_group blood_group_type NOT NULL,
    component blood_component_type NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'COLLECTION', 'RESERVATION', 'RELEASE', 'DISCARD', 'EXPIRY', 'AUDIT_ADJUSTMENT'
    units_changed INT NOT NULL,
    previous_available INT NOT NULL,
    new_available INT NOT NULL,
    reason TEXT,
    reference_id UUID,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BLOOD REQUESTS & DONOR CHAIN
CREATE TABLE IF NOT EXISTS blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code VARCHAR(30) UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES profiles(id),
    patient_name VARCHAR(255),
    patient_id_ref VARCHAR(100),
    blood_group blood_group_type NOT NULL,
    component blood_component_type NOT NULL DEFAULT 'WHOLE_BLOOD',
    units_needed INT NOT NULL CHECK (units_needed > 0),
    units_fulfilled INT NOT NULL DEFAULT 0 CHECK (units_fulfilled >= 0),
    urgency VARCHAR(20) DEFAULT 'HIGH' CHECK (urgency IN ('CRITICAL', 'HIGH', 'MEDIUM', 'ROUTINE')),
    status blood_request_status_type DEFAULT 'CREATED',
    required_by_time TIMESTAMPTZ NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    status donor_chain_status_type DEFAULT 'INITIATED',
    current_tier INT DEFAULT 1,
    batch_size INT DEFAULT 3,
    response_timeout_minutes INT DEFAULT 15,
    auto_escalate BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_chain_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_chain_id UUID NOT NULL REFERENCES donor_chains(id) ON DELETE CASCADE,
    donor_profile_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE RESTRICT,
    tier INT DEFAULT 1,
    notified_at TIMESTAMPTZ DEFAULT NOW(),
    status donor_chain_member_status_type DEFAULT 'NOTIFIED',
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    rejection_reason TEXT,
    eta_minutes INT,
    confirmed_by_facility_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS donor_chain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_chain_id UUID NOT NULL REFERENCES donor_chains(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AMBULANCES & FLEET
CREATE TABLE IF NOT EXISTS ambulance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    registration_code VARCHAR(100) UNIQUE,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    service_radius_km NUMERIC(5,2) DEFAULT 30.0,
    verification_status verification_status_type DEFAULT 'PENDING',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ambulance_providers(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50) DEFAULT 'ADVANCED_LIFE_SUPPORT' CHECK (vehicle_type IN ('BASIC_LIFE_SUPPORT', 'ADVANCED_LIFE_SUPPORT', 'PATIENT_TRANSPORT', 'NEONATAL')),
    equipment_spec JSONB DEFAULT '{}'::JSONB,
    status ambulance_status_type DEFAULT 'AVAILABLE',
    current_latitude DOUBLE PRECISION,
    current_longitude DOUBLE PRECISION,
    current_heading NUMERIC(5,2),
    current_speed_kmh NUMERIC(5,2),
    last_gps_update TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ambulance_providers(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    assigned_ambulance_id UUID REFERENCES ambulances(id) ON DELETE SET NULL,
    verification_status verification_status_type DEFAULT 'PENDING',
    is_on_duty BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id)
);

CREATE TABLE IF NOT EXISTS ambulance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code VARCHAR(30) UNIQUE NOT NULL,
    requested_by UUID NOT NULL REFERENCES profiles(id),
    patient_name VARCHAR(255),
    patient_phone VARCHAR(50),
    pickup_latitude DOUBLE PRECISION NOT NULL,
    pickup_longitude DOUBLE PRECISION NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_hospital_id UUID REFERENCES hospitals(id),
    destination_latitude DOUBLE PRECISION,
    destination_longitude DOUBLE PRECISION,
    destination_address TEXT,
    severity VARCHAR(20) DEFAULT 'CRITICAL' CHECK (severity IN ('CRITICAL', 'SEVERE', 'MODERATE', 'ROUTINE')),
    status ambulance_status_type DEFAULT 'REQUESTED',
    assigned_ambulance_id UUID REFERENCES ambulances(id),
    assigned_driver_id UUID REFERENCES drivers(id),
    accepted_at TIMESTAMPTZ,
    en_route_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    transporting_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    eta_minutes INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id UUID NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    ambulance_request_id UUID REFERENCES ambulance_requests(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude NUMERIC(6,2),
    heading NUMERIC(5,2),
    speed_kmh NUMERIC(5,2),
    accuracy_meters NUMERIC(6,2),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EMERGENCIES & COORDINATION
CREATE TABLE IF NOT EXISTS emergency_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(30) UNIQUE NOT NULL,
    patient_profile_id UUID NOT NULL REFERENCES profiles(id),
    emergency_type VARCHAR(100) NOT NULL DEFAULT 'MEDICAL_SOS',
    status emergency_status_type DEFAULT 'CREATED',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_accuracy_meters NUMERIC(6,2),
    address_description TEXT,
    assigned_hospital_id UUID REFERENCES hospitals(id),
    ambulance_request_id UUID REFERENCES ambulance_requests(id),
    blood_request_id UUID REFERENCES blood_requests(id),
    triage_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emergency_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_session_id UUID NOT NULL REFERENCES emergency_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    status_snapshot emergency_status_type NOT NULL,
    actor_id UUID REFERENCES profiles(id),
    actor_role user_role_type,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. APPOINTMENTS & DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification VARCHAR(255),
    consultation_fee NUMERIC(10,2) DEFAULT 0.0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_type VARCHAR(50) NOT NULL, -- 'HOSPITAL' or 'BLOOD_BANK'
    facility_id UUID NOT NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INT DEFAULT 1,
    booked_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(facility_id, doctor_id, slot_date, start_time)
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code VARCHAR(30) UNIQUE NOT NULL,
    appointment_type VARCHAR(50) NOT NULL, -- 'DOCTOR_CONSULTATION' or 'BLOOD_DONATION'
    patient_profile_id UUID NOT NULL REFERENCES profiles(id),
    facility_type VARCHAR(50) NOT NULL,
    facility_id UUID NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    doctor_id UUID REFERENCES doctors(id),
    slot_id UUID NOT NULL REFERENCES appointment_slots(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    status appointment_status_type DEFAULT 'REQUESTED',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS & PREFERENCES
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status notification_status_enum DEFAULT 'CREATED',
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('URGENT', 'HIGH', 'NORMAL', 'LOW')),
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    emergency_alerts BOOLEAN DEFAULT TRUE,
    blood_requests_sms BOOLEAN DEFAULT TRUE,
    blood_requests_email BOOLEAN DEFAULT TRUE,
    donor_chain_push BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CONSENTS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(50),
    user_agent TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    ip_address VARCHAR(50),
    old_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_blood_group ON profiles(blood_group);
CREATE INDEX IF NOT EXISTS idx_user_roles_profile ON user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_bg_avail ON donor_profiles(blood_group, availability_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_blood_banks_location ON blood_banks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_lookup ON blood_inventory(blood_bank_id, blood_group, component);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status, urgency, blood_group);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status, is_active);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_status ON ambulance_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_status ON emergency_sessions(status, patient_profile_id);
CREATE INDEX IF NOT EXISTS idx_emergency_events_session ON emergency_events(emergency_session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(slot_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, status);


-- ==========================================
-- FILE: 20260902000002_rls_policies.sql
-- ==========================================
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


-- ==========================================
-- FILE: 20260902000003_triggers_and_functions.sql
-- ==========================================
-- LIFELINEX POSTGRESQL FUNCTIONS, TRIGGERS & PROCEDURES: 003_triggers_and_functions.sql
-- Geospatial Calculations, Compatibility Matrix, Inventory Triggers & Realtime Pubs

-- 1. HAVERSINE DISTANCE FORMULA
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r DOUBLE PRECISION := 6371.0; -- Earth radius in km
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat / 2.0)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0)^2;
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. BLOOD COMPATIBILITY CHECK
CREATE OR REPLACE FUNCTION is_blood_compatible(
    donor_bg blood_group_type,
    patient_bg blood_group_type,
    component blood_component_type DEFAULT 'WHOLE_BLOOD'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Red blood cells / Whole blood compatibility rules
    IF component IN ('WHOLE_BLOOD', 'PRBC') THEN
        IF donor_bg = 'O-' THEN RETURN TRUE; END IF;
        IF donor_bg = 'O+' AND patient_bg IN ('O+', 'A+', 'B+', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'A-' AND patient_bg IN ('A-', 'A+', 'AB-', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'A+' AND patient_bg IN ('A+', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'B-' AND patient_bg IN ('B-', 'B+', 'AB-', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'B+' AND patient_bg IN ('B+', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'AB-' AND patient_bg IN ('AB-', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'AB+' AND patient_bg = 'AB+' THEN RETURN TRUE; END IF;
        RETURN FALSE;
    END IF;

    -- Plasma (FFP) compatibility is reverse of RBC
    IF component = 'FFP' THEN
        IF donor_bg = 'AB+' THEN RETURN TRUE; END IF;
        IF donor_bg IN ('AB-', 'AB+') AND patient_bg IN ('AB-', 'AB+') THEN RETURN TRUE; END IF;
        IF donor_bg IN ('A-', 'A+') AND patient_bg IN ('A-', 'A+', 'O-', 'O+') THEN RETURN TRUE; END IF;
        IF donor_bg IN ('B-', 'B+') AND patient_bg IN ('B-', 'B+', 'O-', 'O+') THEN RETURN TRUE; END IF;
        IF donor_bg = 'O+' AND patient_bg IN ('O+', 'O-') THEN RETURN TRUE; END IF;
        IF donor_bg = 'O-' AND patient_bg = 'O-' THEN RETURN TRUE; END IF;
        RETURN FALSE;
    END IF;

    -- Platelets / Cryoprecipitate default to group identical or safe compatible
    RETURN (donor_bg = patient_bg OR donor_bg = 'O-');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. SMART DONOR MATCHING FUNCTION
CREATE OR REPLACE FUNCTION match_potential_donors(
    p_blood_group blood_group_type,
    p_component blood_component_type,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_max_distance_km DOUBLE PRECISION DEFAULT 25.0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    donor_profile_id UUID,
    full_name VARCHAR(255),
    blood_group blood_group_type,
    distance_km DOUBLE PRECISION,
    availability_status donor_availability_type,
    total_donations_count INT,
    last_donation_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.id AS donor_profile_id,
        p.full_name,
        dp.blood_group,
        calculate_distance_km(p.latitude, p.longitude, p_latitude, p_longitude) AS distance_km,
        dp.availability_status,
        dp.total_donations_count,
        dp.last_donation_date
    FROM donor_profiles dp
    JOIN profiles p ON p.id = dp.profile_id
    WHERE dp.availability_status = 'AVAILABLE'
      AND dp.verification_status = 'VERIFIED'
      AND is_blood_compatible(dp.blood_group, p_blood_group, p_component) = TRUE
      AND (p.latitude IS NOT NULL AND p.longitude IS NOT NULL)
      AND calculate_distance_km(p.latitude, p.longitude, p_latitude, p_longitude) <= p_max_distance_km
    ORDER BY 
        (dp.blood_group = p_blood_group) DESC, -- Exact blood group matches first
        distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. INVENTORY AUDIT TRIGGER
CREATE OR REPLACE FUNCTION log_blood_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (NEW.units_available <> OLD.units_available) THEN
            INSERT INTO blood_inventory_events (
                blood_bank_id,
                blood_group,
                component,
                change_type,
                units_changed,
                previous_available,
                new_available,
                reason
            ) VALUES (
                NEW.blood_bank_id,
                NEW.blood_group,
                NEW.component,
                CASE 
                    WHEN NEW.units_available < OLD.units_available THEN 'RESERVATION_OR_DISPATCH'
                    ELSE 'COLLECTION_OR_RETURN'
                END,
                NEW.units_available - OLD.units_available,
                OLD.units_available,
                NEW.units_available,
                'Automated inventory update trigger'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blood_inventory_audit ON blood_inventory;
CREATE TRIGGER trg_blood_inventory_audit
    AFTER UPDATE ON blood_inventory
    FOR EACH ROW
    EXECUTE FUNCTION log_blood_inventory_change();

-- 5. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_donor_profiles_updated_at BEFORE UPDATE ON donor_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_blood_banks_updated_at BEFORE UPDATE ON blood_banks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_blood_requests_updated_at BEFORE UPDATE ON blood_requests FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_donor_chains_updated_at BEFORE UPDATE ON donor_chains FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_ambulances_updated_at BEFORE UPDATE ON ambulances FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_ambulance_requests_updated_at BEFORE UPDATE ON ambulance_requests FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_emergency_sessions_updated_at BEFORE UPDATE ON emergency_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 6. ENABLE REALTIME REPLICATION
DO $$
BEGIN
    -- Add tables to supabase_realtime publication safely
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE emergency_sessions;
        ALTER PUBLICATION supabase_realtime ADD TABLE emergency_events;
        ALTER PUBLICATION supabase_realtime ADD TABLE ambulance_locations;
        ALTER PUBLICATION supabase_realtime ADD TABLE ambulance_requests;
        ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
        ALTER PUBLICATION supabase_realtime ADD TABLE donor_chains;
        ALTER PUBLICATION supabase_realtime ADD TABLE donor_chain_members;
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        ALTER PUBLICATION supabase_realtime ADD TABLE blood_inventory;
    END IF;
END $$;


-- ==========================================
-- FILE: 20260902000004_seed_data.sql
-- ==========================================
-- LIFELINEX SEED DATA MIGRATION: 004_seed_data.sql
-- High-Quality Realistic Seed Data for Development & Testing

-- Profiles
INSERT INTO profiles (id, email, phone, full_name, blood_group, city, state, latitude, longitude, preferred_language)
VALUES 
    ('11111111-1111-1111-1111-111111111101', 'patient.rahul@lifelinex.org', '+919876543210', 'Rahul Sharma', 'O+', 'Chennai', 'Tamil Nadu', 13.0827, 80.2707, 'en'),
    ('11111111-1111-1111-1111-111111111102', 'donor.priya@lifelinex.org', '+919876543211', 'Priya Sundaram', 'O+', 'Chennai', 'Tamil Nadu', 13.0850, 80.2750, 'ta'),
    ('11111111-1111-1111-1111-111111111103', 'donor.anand@lifelinex.org', '+919876543212', 'Anand Kumar', 'O-', 'Chennai', 'Tamil Nadu', 13.0780, 80.2650, 'en'),
    ('11111111-1111-1111-1111-111111111104', 'donor.kavita@lifelinex.org', '+919876543213', 'Kavita Patel', 'A+', 'Chennai', 'Tamil Nadu', 13.0910, 80.2810, 'hi'),
    ('11111111-1111-1111-1111-111111111105', 'hospital.admin@apollo.org', '+919876543214', 'Dr. Arvind Swaminathan', 'B+', 'Chennai', 'Tamil Nadu', 13.0600, 80.2500, 'en'),
    ('11111111-1111-1111-1111-111111111106', 'bloodbank.director@redcross.org', '+919876543215', 'Dr. Meenakshi Raman', 'AB+', 'Chennai', 'Tamil Nadu', 13.0700, 80.2400, 'en'),
    ('11111111-1111-1111-1111-111111111107', 'ambulance.driver1@medifleet.org', '+919876543216', 'Murugan Velu', 'B+', 'Chennai', 'Tamil Nadu', 13.0800, 80.2600, 'ta'),
    ('11111111-1111-1111-1111-111111111108', 'admin@lifelinex.org', '+919876543217', 'LifelineX Master Admin', 'O+', 'Chennai', 'Tamil Nadu', 13.0827, 80.2707, 'en')
ON CONFLICT (id) DO NOTHING;

-- User Roles
INSERT INTO user_roles (profile_id, role, is_primary) VALUES
    ('11111111-1111-1111-1111-111111111101', 'PATIENT', TRUE),
    ('11111111-1111-1111-1111-111111111102', 'DONOR', TRUE),
    ('11111111-1111-1111-1111-111111111103', 'DONOR', TRUE),
    ('11111111-1111-1111-1111-111111111104', 'DONOR', TRUE),
    ('11111111-1111-1111-1111-111111111105', 'HOSPITAL_ADMIN', TRUE),
    ('11111111-1111-1111-1111-111111111105', 'HOSPITAL_STAFF', FALSE),
    ('11111111-1111-1111-1111-111111111106', 'BLOOD_BANK_ADMIN', TRUE),
    ('11111111-1111-1111-1111-111111111106', 'BLOOD_BANK_STAFF', FALSE),
    ('11111111-1111-1111-1111-111111111107', 'AMBULANCE_DRIVER', TRUE),
    ('11111111-1111-1111-1111-111111111108', 'LIFELINEX_ADMIN', TRUE),
    ('11111111-1111-1111-1111-111111111108', 'SUPER_ADMIN', FALSE)
ON CONFLICT DO NOTHING;

-- Donor Profiles
INSERT INTO donor_profiles (id, profile_id, blood_group, availability_status, verification_status, total_donations_count, weight_kg, medical_declaration_passed) VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'O+', 'AVAILABLE', 'VERIFIED', 4, 62.0, TRUE),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103', 'O-', 'AVAILABLE', 'VERIFIED', 8, 70.5, TRUE),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111104', 'A+', 'AVAILABLE', 'VERIFIED', 2, 58.0, TRUE)
ON CONFLICT DO NOTHING;

-- Hospitals
INSERT INTO hospitals (id, name, registration_number, email, phone, emergency_phone, address, city, state, postal_code, latitude, longitude, verification_status, total_beds, icu_beds_available, total_icu_beds, has_blood_bank, has_emergency_ward) VALUES
    ('33333333-3333-3333-3333-333333333301', 'Apollo Apex Multi-Specialty Hospital', 'HOSP-TN-2024-8841', 'emergency@apolloapex.org', '+914428290200', '+914428299999', '21 Greams Lane, Thousand Lights', 'Chennai', 'Tamil Nadu', '600006', 13.0600, 80.2500, 'VERIFIED', 450, 18, 45, TRUE, TRUE),
    ('33333333-3333-3333-3333-333333333302', 'Fortis Malar Emergency Center', 'HOSP-TN-2023-5512', 'dispatch@fortismalar.org', '+914442892222', '+914442890000', '52 First Main Road, Gandhi Nagar, Adyar', 'Chennai', 'Tamil Nadu', '600020', 13.0067, 80.2570, 'VERIFIED', 220, 8, 25, FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Hospital Staff Link
INSERT INTO hospital_staff (hospital_id, profile_id, role, department) VALUES
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111105', 'HOSPITAL_ADMIN', 'Critical Care & Emergency')
ON CONFLICT DO NOTHING;

-- Blood Banks
INSERT INTO blood_banks (id, name, license_number, email, phone, address, city, state, postal_code, latitude, longitude, verification_status, low_stock_threshold_units) VALUES
    ('44444444-4444-4444-4444-444444444401', 'Red Cross Regional Blood Center', 'BB-TN-LIC-9902', 'bloodcenter@redcrosschennai.org', '+914428554522', '50 Red Cross Road, Egmore', 'Chennai', 'Tamil Nadu', '600008', 13.0700, 80.2400, 'VERIFIED', 10),
    ('44444444-4444-4444-4444-444444444402', 'Lions Blood Bank & Research Institute', 'BB-TN-LIC-3310', 'helpline@lionsbloodbank.org', '+914428171122', '130 Marshalls Road, Egmore', 'Chennai', 'Tamil Nadu', '600008', 13.0730, 80.2550, 'VERIFIED', 8)
ON CONFLICT DO NOTHING;

-- Blood Bank Staff Link
INSERT INTO blood_bank_staff (blood_bank_id, profile_id, role) VALUES
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111106', 'BLOOD_BANK_ADMIN')
ON CONFLICT DO NOTHING;

-- Blood Inventory
INSERT INTO blood_inventory (blood_bank_id, blood_group, component, units_available, units_reserved, earliest_expiry_date) VALUES
    ('44444444-4444-4444-4444-444444444401', 'O+', 'WHOLE_BLOOD', 14, 2, CURRENT_DATE + INTERVAL '28 days'),
    ('44444444-4444-4444-4444-444444444401', 'O-', 'WHOLE_BLOOD', 3, 1, CURRENT_DATE + INTERVAL '21 days'),
    ('44444444-4444-4444-4444-444444444401', 'A+', 'WHOLE_BLOOD', 18, 0, CURRENT_DATE + INTERVAL '30 days'),
    ('44444444-4444-4444-4444-444444444401', 'B+', 'WHOLE_BLOOD', 12, 1, CURRENT_DATE + INTERVAL '25 days'),
    ('44444444-4444-4444-4444-444444444401', 'AB+', 'WHOLE_BLOOD', 6, 0, CURRENT_DATE + INTERVAL '32 days'),
    ('44444444-4444-4444-4444-444444444401', 'O+', 'PRBC', 22, 4, CURRENT_DATE + INTERVAL '35 days'),
    ('44444444-4444-4444-4444-444444444401', 'O+', 'PLATELETS', 7, 0, CURRENT_DATE + INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- Ambulance Provider
INSERT INTO ambulance_providers (id, name, registration_code, phone, email, city, state, service_radius_km, verification_status) VALUES
    ('55555555-5555-5555-5555-555555555501', 'MediFleet QuickResponse Network', 'AMB-TN-9912', '+914424991100', 'fleet@medifleet.org', 'Chennai', 'Tamil Nadu', 35.0, 'VERIFIED')
ON CONFLICT DO NOTHING;

-- Ambulances
INSERT INTO ambulances (id, provider_id, vehicle_number, vehicle_type, status, current_latitude, current_longitude, current_heading, current_speed_kmh) VALUES
    ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'TN-01-EM-1080', 'ADVANCED_LIFE_SUPPORT', 'AVAILABLE', 13.0800, 80.2600, 45.0, 0.0),
    ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'TN-01-EM-1082', 'BASIC_LIFE_SUPPORT', 'AVAILABLE', 13.0550, 80.2450, 180.0, 0.0)
ON CONFLICT DO NOTHING;

-- Drivers
INSERT INTO drivers (id, provider_id, profile_id, license_number, assigned_ambulance_id, verification_status, is_on_duty) VALUES
    ('77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111107', 'TN0120200008891', '66666666-6666-6666-6666-666666666601', 'VERIFIED', TRUE)
ON CONFLICT DO NOTHING;

-- Doctors
INSERT INTO doctors (id, hospital_id, name, specialty, qualification, consultation_fee, is_available) VALUES
    ('88888888-8888-8888-8888-888888888801', '33333333-3333-3333-3333-333333333301', 'Dr. Radhika Sen', 'Emergency Medicine & Trauma', 'MBBS, MD (Emergency Medicine)', 800.0, TRUE),
    ('88888888-8888-8888-8888-888888888802', '33333333-3333-3333-3333-333333333301', 'Dr. Vignesh Karthik', 'Cardiology & Intensive Care', 'MBBS, DM (Cardiology)', 1200.0, TRUE),
    ('88888888-8888-8888-8888-888888888803', '33333333-3333-3333-3333-333333333301', 'Dr. Ananya Roy', 'Hematology & Transfusion Medicine', 'MBBS, MD (Transfusion Med)', 900.0, TRUE)
ON CONFLICT DO NOTHING;


-- ==========================================
-- FILE: 20260902000005_concurrency_and_storage.sql
-- ==========================================
-- LIFELINEX POSTGRESQL CONCURRENCY & STORAGE MIGRATION: 005_concurrency_and_storage.sql
-- Row-Level Locks, Atomic Transaction Procedures & Private Storage Buckets

-- 1. ATOMIC INVENTORY RESERVATION WITH ROW-LEVEL LOCK (SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION reserve_blood_inventory_atomic(
    p_blood_bank_id UUID,
    p_blood_group blood_group_type,
    p_component blood_component_type,
    p_units INT,
    p_performed_by UUID DEFAULT NULL,
    p_reason TEXT DEFAULT 'Emergency blood unit reservation'
)
RETURNS JSONB AS $$
DECLARE
    v_inv_id UUID;
    v_available INT;
    v_reserved INT;
BEGIN
    IF p_units <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Requested units must be greater than zero');
    END IF;

    -- Acquire row-level exclusive lock on the specific blood inventory record
    SELECT id, units_available, units_reserved
    INTO v_inv_id, v_available, v_reserved
    FROM blood_inventory
    WHERE blood_bank_id = p_blood_bank_id
      AND blood_group = p_blood_group
      AND component = p_component
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Specified blood inventory item not found at facility');
    END IF;

    -- Concurrency check: prevent over-reservation
    IF v_available < p_units THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient inventory units available for reservation',
            'available', v_available,
            'requested', p_units
        );
    END IF;

    -- Atomically update inventory
    UPDATE blood_inventory
    SET units_available = units_available - p_units,
        units_reserved = units_reserved + p_units,
        last_updated = NOW()
    WHERE id = v_inv_id;

    -- Explicit Audit Event Logging
    INSERT INTO blood_inventory_events (
        blood_bank_id,
        blood_group,
        component,
        change_type,
        units_changed,
        previous_available,
        new_available,
        reason,
        performed_by
    ) VALUES (
        p_blood_bank_id,
        p_blood_group,
        p_component,
        'RESERVATION',
        -p_units,
        v_available,
        v_available - p_units,
        p_reason,
        p_performed_by
    );

    RETURN jsonb_build_object(
        'success', true,
        'inventory_id', v_inv_id,
        'units_reserved', p_units,
        'new_available', v_available - p_units,
        'new_reserved', v_reserved + p_units
    );
END;
$$ LANGUAGE plpgsql;

-- 2. ATOMIC APPOINTMENT BOOKING WITH SLOT CAPACITY CHECK
CREATE OR REPLACE FUNCTION book_appointment_slot_atomic(
    p_patient_profile_id UUID,
    p_appointment_type VARCHAR(50),
    p_facility_type VARCHAR(50),
    p_facility_id UUID,
    p_facility_name VARCHAR(255),
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_slot_id UUID;
    v_max_cap INT;
    v_booked INT;
    v_apt_id UUID;
    v_apt_code VARCHAR(30);
BEGIN
    v_apt_code := 'APT-' || to_char(NOW(), 'YYMMDD') || '-' || substr(md5(random()::text), 1, 6);

    -- Find or ensure slot with exclusive lock
    SELECT id, max_capacity, booked_count
    INTO v_slot_id, v_max_cap, v_booked
    FROM appointment_slots
    WHERE facility_id = p_facility_id
      AND ((p_doctor_id IS NULL AND doctor_id IS NULL) OR doctor_id = p_doctor_id)
      AND slot_date = p_appointment_date
      AND start_time = p_start_time
    FOR UPDATE;

    IF FOUND THEN
        IF v_booked >= v_max_cap THEN
            RETURN jsonb_build_object('success', false, 'error', 'This appointment slot is already fully booked');
        END IF;

        UPDATE appointment_slots
        SET booked_count = booked_count + 1
        WHERE id = v_slot_id;
    ELSE
        INSERT INTO appointment_slots (
            facility_type, facility_id, doctor_id, slot_date, start_time, end_time, max_capacity, booked_count
        ) VALUES (
            p_facility_type, p_facility_id, p_doctor_id, p_appointment_date, p_start_time, p_start_time + INTERVAL '30 minutes', 1, 1
        ) RETURNING id INTO v_slot_id;
    END IF;

    -- Insert confirmed appointment
    INSERT INTO appointments (
        appointment_code, appointment_type, patient_profile_id, facility_type,
        facility_id, facility_name, doctor_id, slot_id, appointment_date, start_time,
        status, notes
    ) VALUES (
        v_apt_code, p_appointment_type, p_patient_profile_id, p_facility_type,
        p_facility_id, p_facility_name, p_doctor_id, v_slot_id, p_appointment_date, p_start_time,
        'CONFIRMED', p_notes
    ) RETURNING id INTO v_apt_id;

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_apt_id,
        'appointment_code', v_apt_code,
        'slot_id', v_slot_id
    );
END;
$$ LANGUAGE plpgsql;

-- 3. ATOMIC AMBULANCE DISPATCH ASSIGNMENT
CREATE OR REPLACE FUNCTION assign_ambulance_driver_atomic(
    p_ambulance_request_id UUID,
    p_ambulance_id UUID,
    p_driver_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_amb_status ambulance_status_type;
BEGIN
    -- Check ambulance availability with lock
    SELECT status INTO v_amb_status
    FROM ambulances
    WHERE id = p_ambulance_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ambulance vehicle not found');
    END IF;

    IF v_amb_status <> 'AVAILABLE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ambulance is currently assigned to another active emergency');
    END IF;

    -- Assign to request
    UPDATE ambulance_requests
    SET assigned_ambulance_id = p_ambulance_id,
        assigned_driver_id = p_driver_id,
        status = 'ACCEPTED',
        accepted_at = NOW()
    WHERE id = p_ambulance_request_id;

    -- Lock ambulance status
    UPDATE ambulances
    SET status = 'ACCEPTED'
    WHERE id = p_ambulance_id;

    RETURN jsonb_build_object('success', true, 'status', 'ACCEPTED');
END;
$$ LANGUAGE plpgsql;

-- 4. PRIVATE SUPABASE STORAGE BUCKETS & SECURITY POLICIES
-- Create Private Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('donor-documents', 'donor-documents', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('hospital-licenses', 'hospital-licenses', FALSE, 15728640, ARRAY['image/jpeg', 'image/png', 'application/pdf']),
    ('medical-records', 'medical-records', FALSE, 20971520, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = FALSE;

-- Storage RLS: Donor Documents only viewable by donor owner and verified hospital/lifeline admins
CREATE POLICY "Donor document uploads by owner"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'donor-documents'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
    );

CREATE POLICY "Donor documents viewable by owner or admin"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'donor-documents'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
    );

CREATE POLICY "Medical records viewable only by authorized medical staff"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-records'
        AND (auth.uid()::text = (storage.foldername(name))[1] OR has_user_role('HOSPITAL_STAFF') OR is_admin())
    );


-- ==========================================
-- FILE: 20260902000006_auth_and_phone_support.sql
-- ==========================================
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


-- ==========================================
-- FILE: 20260902000007_fix_rls_recursion.sql
-- ==========================================
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
