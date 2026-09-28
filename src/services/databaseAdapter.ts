import {
  AmbulanceRequest,
  EmergencySession,
  EmergencyEvent,
  BloodRequest,
  DonorChain,
  DonorChainMember,
  Appointment,
  Notification,
  AuditLog,
  BloodGroupType,
  BloodComponentType,
  UserRoleType,
  PregnancyProfile,
  PregnancyHealthRecord,
  Guardian,
  WearableDevice,
  WearableActivityRecord,
  WearableMovementRecord,
  WearableSleepRecord,
  WearableVitalsRecord,
  WearableAlert,
} from '../types/database';

const DB_STORAGE_KEY = 'lifelinex_production_db_v1';

// Blood Compatibility Algorithm
export const checkBloodCompatibility = (
  donorBg: BloodGroupType,
  patientBg: BloodGroupType,
  component: BloodComponentType = 'WHOLE_BLOOD'
): boolean => {
  if (component === 'WHOLE_BLOOD' || component === 'PRBC') {
    if (donorBg === 'O-') return true;
    if (donorBg === 'O+' && ['O+', 'A+', 'B+', 'AB+'].includes(patientBg)) return true;
    if (donorBg === 'A-' && ['A-', 'A+', 'AB-', 'AB+'].includes(patientBg)) return true;
    if (donorBg === 'A+' && ['A+', 'AB+'].includes(patientBg)) return true;
    if (donorBg === 'B-' && ['B-', 'B+', 'AB-', 'AB+'].includes(patientBg)) return true;
    if (donorBg === 'B+' && ['B+', 'AB+'].includes(patientBg)) return true;
    if (donorBg === 'AB-' && ['AB-', 'AB+'].includes(patientBg)) return true;
    if (donorBg === 'AB+' && patientBg === 'AB+') return true;
    return false;
  }

  if (component === 'FFP') {
    if (donorBg === 'AB+') return true;
    if (['AB-', 'AB+'].includes(donorBg) && ['AB-', 'AB+'].includes(patientBg)) return true;
    if (['A-', 'A+'].includes(donorBg) && ['A-', 'A+', 'O-', 'O+'].includes(patientBg)) return true;
    if (['B-', 'B+'].includes(donorBg) && ['B-', 'B+', 'O-', 'O+'].includes(patientBg)) return true;
    if (donorBg === 'O+' && ['O+', 'O-'].includes(patientBg)) return true;
    if (donorBg === 'O-' && patientBg === 'O-') return true;
    return false;
  }

  return donorBg === patientBg || donorBg === 'O-';
};

// Haversine Distance (Kilometers)
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

// INITIAL SEED DATABASE STATE
const initialSeedDatabase = {
  profiles: [
    {
      id: '11111111-1111-1111-1111-111111111101',
      email: 'patient.rahul@lifelinex.org',
      phone: '+91 98765 43210',
      full_name: 'Rahul Sharma (Patient)',
      blood_group: 'O+' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0827,
      longitude: 80.2707,
      preferred_language: 'en',
      emergency_contact_name: 'Sunita Sharma',
      emergency_contact_phone: '+91 98765 43219',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11111111-1111-1111-1111-111111111102',
      email: 'donor.priya@lifelinex.org',
      phone: '+91 98765 43211',
      full_name: 'Priya Sundaram (Donor)',
      blood_group: 'O+' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.085,
      longitude: 80.275,
      preferred_language: 'ta',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11111111-1111-1111-1111-111111111103',
      email: 'donor.anand@lifelinex.org',
      phone: '+91 98765 43212',
      full_name: 'Anand Kumar (Universal O- Donor)',
      blood_group: 'O-' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.078,
      longitude: 80.265,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11111111-1111-1111-1111-111111111105',
      email: 'hospital.admin@apollo.org',
      phone: '+91 44 2829 0200',
      full_name: 'Dr. Arvind Swaminathan (Hospital Admin)',
      blood_group: 'B+' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.06,
      longitude: 80.25,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11111111-1111-1111-1111-111111111106',
      email: 'bloodbank.director@redcross.org',
      phone: '+91 44 2855 4522',
      full_name: 'Dr. Meenakshi Raman (Blood Bank Director)',
      blood_group: 'AB+' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.07,
      longitude: 80.24,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11111111-1111-1111-1111-111111111107',
      email: 'ambulance.driver1@medifleet.org',
      phone: '+91 98765 43216',
      full_name: 'Murugan Velu (ALS Ambulance Pilot)',
      blood_group: 'B+' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.08,
      longitude: 80.26,
      preferred_language: 'ta',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '11111111-1111-1111-1111-111111111108',
      email: 'admin@lifelinex.org',
      phone: '+91 98765 43217',
      full_name: 'LifelineX Master Administrator',
      blood_group: 'O+' as BloodGroupType,
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0827,
      longitude: 80.2707,
      preferred_language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  user_roles: [
    { id: 'ur-1', profile_id: '11111111-1111-1111-1111-111111111101', role: 'PATIENT' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
    { id: 'ur-2', profile_id: '11111111-1111-1111-1111-111111111102', role: 'DONOR' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
    { id: 'ur-3', profile_id: '11111111-1111-1111-1111-111111111103', role: 'DONOR' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
    { id: 'ur-5', profile_id: '11111111-1111-1111-1111-111111111105', role: 'HOSPITAL_ADMIN' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
    { id: 'ur-5b', profile_id: '11111111-1111-1111-1111-111111111105', role: 'HOSPITAL_STAFF' as UserRoleType, is_primary: false, created_at: new Date().toISOString() },
    { id: 'ur-6', profile_id: '11111111-1111-1111-1111-111111111106', role: 'BLOOD_BANK_ADMIN' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
    { id: 'ur-7', profile_id: '11111111-1111-1111-1111-111111111107', role: 'AMBULANCE_DRIVER' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
    { id: 'ur-8', profile_id: '11111111-1111-1111-1111-111111111108', role: 'LIFELINEX_ADMIN' as UserRoleType, is_primary: true, created_at: new Date().toISOString() },
  ],
  donor_profiles: [
    {
      id: '22222222-2222-2222-2222-222222222201',
      profile_id: '11111111-1111-1111-1111-111111111102',
      blood_group: 'O+' as BloodGroupType,
      availability_status: 'AVAILABLE' as const,
      verification_status: 'VERIFIED' as const,
      last_donation_date: '2026-06-15',
      total_donations_count: 4,
      weight_kg: 62.0,
      medical_declaration_passed: true,
      privacy_blur_location: true,
      auto_notify_blood_requests: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222202',
      profile_id: '11111111-1111-1111-1111-111111111103',
      blood_group: 'O-' as BloodGroupType,
      availability_status: 'AVAILABLE' as const,
      verification_status: 'VERIFIED' as const,
      last_donation_date: '2026-05-10',
      total_donations_count: 8,
      weight_kg: 70.5,
      medical_declaration_passed: true,
      privacy_blur_location: true,
      auto_notify_blood_requests: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  hospitals: [
    {
      id: '33333333-3333-3333-3333-333333333301',
      name: 'Apollo Apex Multi-Specialty Hospital',
      registration_number: 'HOSP-TN-2024-8841',
      email: 'emergency@apolloapex.org',
      phone: '+91 44 2829 0200',
      emergency_phone: '+91 44 2829 9999',
      address: '21 Greams Lane, Thousand Lights',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.06,
      longitude: 80.25,
      verification_status: 'VERIFIED' as const,
      total_beds: 450,
      icu_beds_available: 18,
      total_icu_beds: 45,
      has_blood_bank: true,
      has_emergency_ward: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '33333333-3333-3333-3333-333333333302',
      name: 'Fortis Malar Emergency Center',
      registration_number: 'HOSP-TN-2023-5512',
      email: 'dispatch@fortismalar.org',
      phone: '+91 44 4289 2222',
      emergency_phone: '+91 44 4289 0000',
      address: '52 First Main Road, Gandhi Nagar, Adyar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.0067,
      longitude: 80.257,
      verification_status: 'VERIFIED' as const,
      total_beds: 220,
      icu_beds_available: 8,
      total_icu_beds: 25,
      has_blood_bank: false,
      has_emergency_ward: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  blood_banks: [
    {
      id: '44444444-4444-4444-4444-444444444401',
      name: 'Red Cross Regional Blood Center',
      license_number: 'BB-TN-LIC-9902',
      email: 'bloodcenter@redcrosschennai.org',
      phone: '+91 44 2855 4522',
      address: '50 Red Cross Road, Egmore',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.07,
      longitude: 80.24,
      verification_status: 'VERIFIED' as const,
      low_stock_threshold_units: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '44444444-4444-4444-4444-444444444402',
      name: 'Lions Blood Bank & Research Institute',
      license_number: 'BB-TN-LIC-3310',
      email: 'helpline@lionsbloodbank.org',
      phone: '+91 44 2817 1122',
      address: '130 Marshalls Road, Egmore',
      city: 'Chennai',
      state: 'Tamil Nadu',
      latitude: 13.073,
      longitude: 80.255,
      verification_status: 'VERIFIED' as const,
      low_stock_threshold_units: 8,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  blood_inventory: [
    { id: 'bi-1', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'O+' as BloodGroupType, component: 'WHOLE_BLOOD' as BloodComponentType, units_available: 14, units_reserved: 2, units_quarantined: 0, earliest_expiry_date: '2026-09-30', storage_temperature_celsius: 4.0, last_updated: new Date().toISOString() },
    { id: 'bi-2', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'O-' as BloodGroupType, component: 'WHOLE_BLOOD' as BloodComponentType, units_available: 3, units_reserved: 1, units_quarantined: 0, earliest_expiry_date: '2026-09-22', storage_temperature_celsius: 4.0, last_updated: new Date().toISOString() },
    { id: 'bi-3', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'A+' as BloodGroupType, component: 'WHOLE_BLOOD' as BloodComponentType, units_available: 18, units_reserved: 0, units_quarantined: 0, earliest_expiry_date: '2026-10-02', storage_temperature_celsius: 4.0, last_updated: new Date().toISOString() },
    { id: 'bi-4', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'B+' as BloodGroupType, component: 'WHOLE_BLOOD' as BloodComponentType, units_available: 12, units_reserved: 1, units_quarantined: 0, earliest_expiry_date: '2026-09-28', storage_temperature_celsius: 4.0, last_updated: new Date().toISOString() },
    { id: 'bi-5', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'AB+' as BloodGroupType, component: 'WHOLE_BLOOD' as BloodComponentType, units_available: 6, units_reserved: 0, units_quarantined: 0, earliest_expiry_date: '2026-10-05', storage_temperature_celsius: 4.0, last_updated: new Date().toISOString() },
    { id: 'bi-6', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'O+' as BloodGroupType, component: 'PRBC' as BloodComponentType, units_available: 22, units_reserved: 4, units_quarantined: 0, earliest_expiry_date: '2026-10-10', storage_temperature_celsius: 4.0, last_updated: new Date().toISOString() },
    { id: 'bi-7', blood_bank_id: '44444444-4444-4444-4444-444444444401', blood_group: 'O+' as BloodGroupType, component: 'PLATELETS' as BloodComponentType, units_available: 7, units_reserved: 0, units_quarantined: 0, earliest_expiry_date: '2026-09-06', storage_temperature_celsius: 22.0, last_updated: new Date().toISOString() },
  ],
  ambulances: [
    {
      id: '66666666-6666-6666-6666-666666666601',
      provider_id: '55555555-5555-5555-5555-555555555501',
      vehicle_number: 'TN-01-EM-1080',
      vehicle_type: 'ADVANCED_LIFE_SUPPORT' as const,
      status: 'AVAILABLE' as const,
      current_latitude: 13.08,
      current_longitude: 80.26,
      current_heading: 45,
      current_speed_kmh: 0,
      last_gps_update: new Date().toISOString(),
      is_active: true,
    },
    {
      id: '66666666-6666-6666-6666-666666666602',
      provider_id: '55555555-5555-5555-5555-555555555501',
      vehicle_number: 'TN-01-EM-1082',
      vehicle_type: 'BASIC_LIFE_SUPPORT' as const,
      status: 'AVAILABLE' as const,
      current_latitude: 13.055,
      current_longitude: 80.245,
      current_heading: 180,
      current_speed_kmh: 0,
      last_gps_update: new Date().toISOString(),
      is_active: true,
    },
  ],
  drivers: [
    {
      id: '77777777-7777-7777-7777-777777777701',
      provider_id: '55555555-5555-5555-5555-555555555501',
      profile_id: '11111111-1111-1111-1111-111111111107',
      license_number: 'TN0120200008891',
      assigned_ambulance_id: '66666666-6666-6666-6666-666666666601',
      verification_status: 'VERIFIED' as const,
      is_on_duty: true,
    },
  ],
  ambulance_requests: [] as AmbulanceRequest[],
  emergency_sessions: [] as EmergencySession[],
  emergency_events: [] as EmergencyEvent[],
  blood_requests: [] as BloodRequest[],
  donor_chains: [] as DonorChain[],
  donor_chain_members: [] as DonorChainMember[],
  doctors: [
    {
      id: '88888888-8888-8888-8888-888888888801',
      hospital_id: '33333333-3333-3333-3333-333333333301',
      name: 'Dr. Radhika Sen',
      specialty: 'Trauma & Emergency Surgery',
      qualification: 'MBBS, MS (General Surgery), Trauma Fellow',
      consultation_fee: 800.0,
      is_available: true,
    },
    {
      id: '88888888-8888-8888-8888-888888888802',
      hospital_id: '33333333-3333-3333-3333-333333333301',
      name: 'Dr. Vignesh Karthik',
      specialty: 'Cardiology & Critical Care',
      qualification: 'MBBS, MD, DM (Cardiology)',
      consultation_fee: 1200.0,
      is_available: true,
    },
  ],
  appointments: [] as Appointment[],
  notifications: [
    {
      id: 'notif-welcome',
      recipient_id: '11111111-1111-1111-1111-111111111101',
      type: 'SYSTEM' as const,
      title: 'Welcome to LifelineX',
      body: 'Your verified emergency healthcare profile is active and connected to the emergency response grid.',
      status: 'DELIVERED' as const,
      priority: 'NORMAL' as const,
      created_at: new Date().toISOString(),
    },
  ] as Notification[],
  audit_logs: [] as AuditLog[],
  pregnancy_profiles: [
    {
      id: '88888888-8888-8888-8888-888888888801',
      patient_profile_id: '11111111-1111-1111-1111-111111111101', // Rahul Sharma
      hospital_id: '33333333-3333-3333-3333-333333333301', // Apollo Apex Multi-Specialty
      pregnancy_week: 24,
      due_date: '2026-11-15',
      blood_group: 'O+' as BloodGroupType,
      risk_level: 'HIGH' as const,
      status: 'ACTIVE' as const,
      notes: 'Gestational monitoring; slight hypertension; scheduled for anomaly ultrasound review.',
      created_at: '2026-05-10T10:00:00.000Z',
      updated_at: '2026-09-20T10:00:00.000Z',
    },
    {
      id: '88888888-8888-8888-8888-888888888802',
      patient_profile_id: '11111111-1111-1111-1111-111111111102', // Priya Sundaram
      hospital_id: '33333333-3333-3333-3333-333333333302', // Fortis Malar Hospital
      pregnancy_week: 16,
      due_date: '2027-01-10',
      blood_group: 'O+' as BloodGroupType,
      risk_level: 'LOW' as const,
      status: 'ACTIVE' as const,
      notes: 'Standard antenatal pathway; fetal growth parameters within normal percentile.',
      created_at: '2026-06-01T09:00:00.000Z',
      updated_at: '2026-09-15T09:00:00.000Z',
    },
  ] as PregnancyProfile[],
  pregnancy_health_records: [
    {
      id: '99999999-9999-9999-9999-999999999901',
      profile_id: '88888888-8888-8888-8888-888888888801',
      record_date: '2026-09-25T08:30:00.000Z',
      blood_pressure: '128/84',
      weight_kg: 64.5,
      blood_sugar_mg_dL: 98,
      temperature_c: 36.8,
      heart_rate_bpm: 82,
      baby_movement_count: 14,
      sleep_hours: 7.5,
      water_intake_ml: 2600,
      medication: 'Iron & Folic Acid supplements',
      supplements: 'Calcium D3',
      symptoms: 'Mild ankle edema in evening',
      notes: 'Vitals stable; continued routine hydration and leg elevation.',
      recorded_by: 'DOCTOR' as const,
      verified: true,
      created_at: '2026-09-25T08:30:00.000Z',
      updated_at: '2026-09-25T08:30:00.000Z',
    },
    {
      id: '99999999-9999-9999-9999-999999999902',
      profile_id: '88888888-8888-8888-8888-888888888801',
      record_date: '2026-09-20T09:15:00.000Z',
      blood_pressure: '132/86',
      weight_kg: 63.8,
      blood_sugar_mg_dL: 104,
      temperature_c: 36.6,
      heart_rate_bpm: 86,
      baby_movement_count: 12,
      sleep_hours: 6.5,
      water_intake_ml: 2200,
      medication: 'Prenatal Multivitamin',
      supplements: 'Calcium D3',
      symptoms: 'Fatigue after prolonged standing',
      notes: 'Mild blood pressure elevation; monitor daily vitals.',
      recorded_by: 'PATIENT' as const,
      verified: true,
      created_at: '2026-09-20T09:15:00.000Z',
      updated_at: '2026-09-20T09:15:00.000Z',
    },
  ] as PregnancyHealthRecord[],
  guardians: [
    {
      id: '77777777-7777-7777-7777-777777777701',
      patient_profile_id: '11111111-1111-1111-1111-111111111101',
      name: 'Sunita Sharma',
      relationship: 'Spouse',
      phone_number: '+91 98765 43219',
      priority: 'PRIMARY' as const,
      verification_status: 'VERIFIED' as const,
      notification_status: 'DELIVERED' as const,
      created_at: '2026-05-10T10:00:00.000Z',
      updated_at: '2026-05-10T10:00:00.000Z',
    },
    {
      id: '77777777-7777-7777-7777-777777777702',
      patient_profile_id: '11111111-1111-1111-1111-111111111101',
      name: 'Vikram Sharma',
      relationship: 'Brother',
      phone_number: '+91 98765 43220',
      priority: 'SECONDARY' as const,
      verification_status: 'VERIFIED' as const,
      notification_status: 'DELIVERED' as const,
      created_at: '2026-05-10T10:00:00.000Z',
      updated_at: '2026-05-10T10:00:00.000Z',
    },
  ] as Guardian[],
  wearable_devices: [
    {
      id: '66666666-6666-6666-6666-666666666601',
      patient_id: '11111111-1111-1111-1111-111111111101', // Rahul Sharma (Patient)
      pregnancy_id: '88888888-8888-8888-8888-888888888801', // Linked to Apollo
      device_name: 'LifelineX Maternal ESP32 Band',
      device_model: 'ESP32-MAX30102-MPU6050',
      mac_address_masked: 'C4:4F:33:**:**:1A',
      battery_level: 84,
      connection_status: 'CONNECTED' as const,
      last_synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      firmware_version: 'v1.4.2-rel',
      created_at: '2026-05-12T08:00:00.000Z',
      updated_at: new Date().toISOString(),
    },
  ] as WearableDevice[],
  wearable_activity_records: [
    {
      id: '55555555-5555-5555-5555-555555555501',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      steps: 4820,
      active_duration_minutes: 52,
      activity_level: 'MODERATE' as const,
      recorded_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: '55555555-5555-5555-5555-555555555502',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      steps: 5410,
      active_duration_minutes: 60,
      activity_level: 'LIGHT' as const,
      recorded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
  ] as WearableActivityRecord[],
  wearable_movement_records: [
    {
      id: '44444444-4444-4444-4444-444444444401',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      movement_event_type: 'ROUTINE' as const,
      intensity: 1.4,
      duration_seconds: 1800,
      movement_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: '44444444-4444-4444-4444-444444444402',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      movement_event_type: 'SUDDEN_MOVEMENT' as const,
      intensity: 4.8,
      duration_seconds: 6,
      movement_timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
  ] as WearableMovementRecord[],
  wearable_sleep_records: [
    {
      id: '33333333-5555-5555-5555-333333333301',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      sleep_start: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      sleep_end: new Date(Date.now() - 6.7 * 60 * 60 * 1000).toISOString(),
      total_duration_minutes: 438, // 7h 18m
      sleep_quality_estimate: 'RESTFUL' as const,
      recorded_at: new Date(Date.now() - 6.7 * 60 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
  ] as WearableSleepRecord[],
  wearable_vitals_records: [
    {
      id: '22222222-5555-5555-5555-222222222201',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      heart_rate: 78,
      spo2: 98.5,
      signal_quality: 'GOOD' as const,
      measurement_timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: '22222222-5555-5555-5555-222222222202',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      heart_rate: 82,
      spo2: 98.0,
      signal_quality: 'GOOD' as const,
      measurement_timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
    {
      id: '22222222-5555-5555-5555-222222222203',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      heart_rate: 76,
      spo2: 97.5,
      signal_quality: 'FAIR' as const,
      measurement_timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      synced_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      sync_status: 'SYNCED' as const,
      source: 'BLE' as const,
      created_at: new Date().toISOString(),
    },
  ] as WearableVitalsRecord[],
  wearable_alerts: [
    {
      id: '11111111-5555-5555-5555-111111111101',
      patient_id: '11111111-1111-1111-1111-111111111101',
      pregnancy_id: '88888888-8888-8888-8888-888888888801',
      device_id: '66666666-6666-6666-6666-666666666601',
      alert_type: 'SUDDEN_MOVEMENT' as const,
      severity: 'WARNING' as const,
      title: 'Sudden Movement Detected',
      message: 'A sudden movement was recorded at 09:30 AM. Please verify that you are feeling comfortable and well.',
      status: 'ACTIVE' as const,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: 'MPU6050_ACCELEROMETER',
    },
  ] as WearableAlert[],
};

type DatabaseSchema = typeof initialSeedDatabase;

class DatabaseAdapter {
  private state: DatabaseSchema;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const seedCopy: any = JSON.parse(JSON.stringify(initialSeedDatabase));
        const merged: any = { ...seedCopy };
        for (const key of Object.keys(seedCopy)) {
          if (Array.isArray(parsed[key])) {
            if (parsed[key].length > 0 || !seedCopy[key]?.length) {
              merged[key] = parsed[key];
            } else {
              merged[key] = seedCopy[key];
            }
          }
        }
        return merged as DatabaseSchema;
      }
    } catch (e) {
      console.warn('Failed to load DB from storage, initializing seed', e);
    }
    this.persist(initialSeedDatabase);
    return JSON.parse(JSON.stringify(initialSeedDatabase));
  }

  private persist(data: DatabaseSchema) {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error persisting database state', e);
    }
  }

  public subscribe(table: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table)!.add(callback);
    return () => {
      this.listeners.get(table)?.delete(callback);
    };
  }

  private notify(table: string) {
    const list = this.listeners.get(table);
    if (list) {
      const data = this.getTable(table as keyof DatabaseSchema);
      list.forEach((cb) => cb(data));
    }
    // Also notify global wildcard
    const globalList = this.listeners.get('*');
    if (globalList) {
      globalList.forEach((cb) => cb({ table, state: this.state }));
    }
  }

  public getTable<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    if (!this.state || !Array.isArray(this.state[table])) {
      const seedCopy = (initialSeedDatabase as any)[table];
      if (!this.state) {
        this.state = JSON.parse(JSON.stringify(initialSeedDatabase));
      } else {
        this.state[table] = (Array.isArray(seedCopy) ? [...seedCopy] : []) as DatabaseSchema[K];
      }
    }
    return this.state[table] || ([] as unknown as DatabaseSchema[K]);
  }

  public setTable<K extends keyof DatabaseSchema>(table: K, data: DatabaseSchema[K]) {
    this.state[table] = data;
    this.persist(this.state);
    this.notify(table);
  }

  public insert<K extends keyof DatabaseSchema>(
    table: K,
    item: any
  ): any {
    const tableData = (this.state[table] as any[]) || [];
    const newItem = {
      id: item.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    };
    (this.state[table] as any[]) = [newItem, ...tableData];
    this.persist(this.state);
    this.notify(table);
    return newItem;
  }

  public update<K extends keyof DatabaseSchema>(
    table: K,
    id: string,
    updates: any
  ): any {
    const tableData = (this.state[table] as any[]) || [];
    const index = tableData.findIndex((row) => row.id === id);
    if (index === -1) return null;
    const updated = {
      ...tableData[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    tableData[index] = updated;
    this.state[table] = tableData as any;
    this.persist(this.state);
    this.notify(table);
    return updated;
  }

  public delete<K extends keyof DatabaseSchema>(
    table: K,
    id: string
  ): boolean {
    const tableData = (this.state[table] as any[]) || [];
    const index = tableData.findIndex((row) => row.id === id);
    if (index === -1) return false;
    tableData.splice(index, 1);
    this.state[table] = tableData as any;
    this.persist(this.state);
    this.notify(table);
    return true;
  }

  public logAudit(actorId: string | undefined, action: string, entityName: string, entityId?: string, oldState?: any, newState?: any) {
    const auditEntry: AuditLog = {
      id: crypto.randomUUID(),
      actor_id: actorId,
      action,
      entity_name: entityName,
      entity_id: entityId,
      ip_address: '127.0.0.1 (Client-Verified)',
      old_state: oldState,
      new_state: newState,
      timestamp: new Date().toISOString(),
    };
    this.insert('audit_logs', auditEntry);
  }

  public resetToSeed() {
    this.state = JSON.parse(JSON.stringify(initialSeedDatabase));
    this.persist(this.state);
    this.listeners.forEach((_, table) => this.notify(table));
  }
}

export const dbAdapter = new DatabaseAdapter();
