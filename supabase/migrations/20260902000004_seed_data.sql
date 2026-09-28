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
