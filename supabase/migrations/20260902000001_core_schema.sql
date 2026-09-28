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
