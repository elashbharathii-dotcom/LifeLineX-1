// LifelineX Database Types & Enumerations

export type UserRoleType =
  | 'PATIENT'
  | 'DONOR'
  | 'HOSPITAL_ADMIN'
  | 'HOSPITAL_STAFF'
  | 'BLOOD_BANK_ADMIN'
  | 'BLOOD_BANK_STAFF'
  | 'AMBULANCE_PROVIDER_ADMIN'
  | 'AMBULANCE_DRIVER'
  | 'LIFELINEX_ADMIN'
  | 'SUPER_ADMIN';

export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodComponentType = 'WHOLE_BLOOD' | 'PRBC' | 'FFP' | 'PLATELETS' | 'CRYOPRECIPITATE';

export type VerificationStatusType =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'SUSPENDED';

export type DonorAvailabilityType = 'AVAILABLE' | 'BUSY' | 'TEMPORARILY_UNAVAILABLE' | 'PAUSED';

export type BloodRequestStatusType =
  | 'CREATED'
  | 'SEARCHING'
  | 'MATCHING'
  | 'PARTIALLY_SECURED'
  | 'SECURED'
  | 'FACILITY_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type DonorChainStatusType =
  | 'INITIATED'
  | 'DISPATCHING'
  | 'IN_PROGRESS'
  | 'SECURED'
  | 'EXPIRED'
  | 'CANCELLED';

export type DonorChainMemberStatusType =
  | 'NOTIFIED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'TIMED_OUT'
  | 'CONFIRMED_BY_FACILITY'
  | 'COMPLETED'
  | 'NO_SHOW';

export type AmbulanceStatusType =
  | 'AVAILABLE'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'TRANSPORTING'
  | 'COMPLETED'
  | 'OFFLINE';

export type EmergencyStatusType =
  | 'CREATED'
  | 'LOCATION_CONFIRMED'
  | 'COORDINATING'
  | 'AMBULANCE_REQUESTED'
  | 'AMBULANCE_ASSIGNED'
  | 'AMBULANCE_EN_ROUTE'
  | 'ARRIVED'
  | 'HOSPITAL_COORDINATED'
  | 'BLOOD_SEARCHING'
  | 'RESOURCE_COORDINATED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AppointmentStatusType =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type NotificationTypeEnum =
  | 'EMERGENCY'
  | 'BLOOD_REQUEST'
  | 'DONOR_CHAIN'
  | 'AMBULANCE'
  | 'APPOINTMENT'
  | 'VERIFICATION'
  | 'INVENTORY'
  | 'SECURITY'
  | 'SYSTEM';

export type NotificationStatusEnum = 'CREATED' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';

export interface Profile {
  id: string;
  auth_user_id?: string;
  email?: string;
  phone?: string;
  full_name: string;
  avatar_url?: string;
  date_of_birth?: string;
  blood_group?: BloodGroupType;
  city?: string;
  state?: string;
  country?: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
  preferred_language?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  profile_id: string;
  role: UserRoleType;
  is_primary: boolean;
  created_at: string;
}

export interface DonorProfile {
  id: string;
  profile_id: string;
  blood_group: BloodGroupType;
  availability_status: DonorAvailabilityType;
  verification_status: VerificationStatusType;
  last_donation_date?: string;
  total_donations_count: number;
  weight_kg?: number;
  medical_declaration_passed: boolean;
  privacy_blur_location: boolean;
  auto_notify_blood_requests: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Hospital {
  id: string;
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  emergency_phone?: string;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatusType;
  total_beds: number;
  icu_beds_available: number;
  total_icu_beds: number;
  has_blood_bank: boolean;
  has_emergency_ward: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BloodBank {
  id: string;
  name: string;
  license_number: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code?: string;
  latitude: number;
  longitude: number;
  verification_status: VerificationStatusType;
  low_stock_threshold_units: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BloodInventoryItem {
  id: string;
  blood_bank_id: string;
  blood_group: BloodGroupType;
  component: BloodComponentType;
  units_available: number;
  units_reserved: number;
  units_quarantined: number;
  earliest_expiry_date?: string;
  storage_temperature_celsius?: number;
  last_updated: string;
}

export interface Ambulance {
  id: string;
  provider_id: string;
  vehicle_number: string;
  vehicle_type: 'BASIC_LIFE_SUPPORT' | 'ADVANCED_LIFE_SUPPORT' | 'PATIENT_TRANSPORT' | 'NEONATAL';
  equipment_spec?: Record<string, any>;
  status: AmbulanceStatusType;
  current_latitude?: number;
  current_longitude?: number;
  current_heading?: number;
  current_speed_kmh?: number;
  last_gps_update?: string;
  is_active: boolean;
}

export interface Driver {
  id: string;
  provider_id: string;
  profile_id: string;
  license_number: string;
  assigned_ambulance_id?: string;
  verification_status: VerificationStatusType;
  is_on_duty: boolean;
  profile?: Profile;
  ambulance?: Ambulance;
}

export interface AmbulanceRequest {
  id: string;
  request_code: string;
  requested_by: string;
  patient_name?: string;
  patient_phone?: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  destination_hospital_id?: string;
  destination_latitude?: number;
  destination_longitude?: number;
  destination_address?: string;
  severity: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'ROUTINE';
  status: AmbulanceStatusType;
  assigned_ambulance_id?: string;
  assigned_driver_id?: string;
  accepted_at?: string;
  en_route_at?: string;
  arrived_at?: string;
  transporting_at?: string;
  completed_at?: string;
  eta_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface EmergencySession {
  id: string;
  session_code: string;
  patient_profile_id: string;
  emergency_type: string;
  status: EmergencyStatusType;
  latitude: number;
  longitude: number;
  location_accuracy_meters?: number;
  address_description?: string;
  assigned_hospital_id?: string;
  ambulance_request_id?: string;
  blood_request_id?: string;
  triage_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  hospital?: Hospital;
}

export interface EmergencyEvent {
  id: string;
  emergency_session_id: string;
  event_type: string;
  status_snapshot: EmergencyStatusType;
  actor_id?: string;
  actor_role?: UserRoleType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface BloodRequest {
  id: string;
  request_code: string;
  hospital_id: string;
  requested_by: string;
  patient_name?: string;
  patient_id_ref?: string;
  blood_group: BloodGroupType;
  component: BloodComponentType;
  units_needed: number;
  units_fulfilled: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE';
  status: BloodRequestStatusType;
  required_by_time: string;
  latitude?: number;
  longitude?: number;
  clinical_notes?: string;
  created_at: string;
  updated_at: string;
  hospital?: Hospital;
}

export interface DonorChain {
  id: string;
  blood_request_id: string;
  status: DonorChainStatusType;
  current_tier: number;
  batch_size: number;
  response_timeout_minutes: number;
  auto_escalate: boolean;
  created_at: string;
  updated_at: string;
  members?: DonorChainMember[];
  blood_request?: BloodRequest;
}

export interface DonorChainMember {
  id: string;
  donor_chain_id: string;
  donor_profile_id: string;
  tier: number;
  notified_at: string;
  status: DonorChainMemberStatusType;
  responded_at?: string;
  expires_at: string;
  rejection_reason?: string;
  eta_minutes?: number;
  confirmed_by_facility_at?: string;
  created_at?: string;
  donor_profile?: DonorProfile;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  name: string;
  specialty: string;
  qualification?: string;
  consultation_fee: number;
  is_available: boolean;
}

export interface Appointment {
  id: string;
  appointment_code: string;
  appointment_type: 'DOCTOR_CONSULTATION' | 'BLOOD_DONATION';
  patient_profile_id: string;
  facility_type: 'HOSPITAL' | 'BLOOD_BANK';
  facility_id: string;
  facility_name: string;
  doctor_id?: string;
  slot_id: string;
  appointment_date: string;
  start_time: string;
  status: AppointmentStatusType;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationTypeEnum;
  title: string;
  body: string;
  status: NotificationStatusEnum;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  action_url?: string;
  metadata?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  entity_name: string;
  entity_id?: string;
  ip_address?: string;
  old_state?: any;
  new_state?: any;
  timestamp: string;
}

// ------------------------------------------------------------
// Pregnancy Care Types and Enums
// ------------------------------------------------------------

export type PregnancyStatusType =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ARCHIVED';

export type GuardianPriority = 'PRIMARY' | 'SECONDARY';
export type GuardianVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type GuardianNotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface PregnancyProfile {
  id: string;
  patient_profile_id: string;
  status: PregnancyStatusType;
  hospital_id?: string;
  doctor_id?: string;
  due_date?: string; // ISO date
  pregnancy_week?: number;
  blood_group?: BloodGroupType;
  risk_level?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PregnancyHealthRecord {
  id: string;
  profile_id: string;
  record_date: string; // ISO date
  blood_pressure?: string; // e.g., "120/80"
  weight_kg?: number;
  blood_sugar_mg_dL?: number;
  temperature_c?: number;
  heart_rate_bpm?: number;
  baby_movement_count?: number;
  sleep_hours?: number;
  water_intake_ml?: number;
  medication?: string; // simple description
  supplements?: string; // simple description
  symptoms?: string; // free text
  notes?: string; // doctor or patient notes
  recorded_by: 'PATIENT' | 'DOCTOR';
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guardian {
  id: string;
  patient_profile_id: string;
  name: string;
  relationship: string;
  phone_number: string;
  priority: GuardianPriority;
  verification_status: GuardianVerificationStatus;
  notification_status: GuardianNotificationStatus;
  created_at: string;
  updated_at: string;
}

// ─── Pregnancy-Only Wearable Monitoring System Types ─────────────────────────
export type WearableConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'PAIRING';
export type WearableSyncStatus = 'LOCAL_ONLY' | 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';
export type SensorSignalQuality = 'GOOD' | 'FAIR' | 'POOR' | 'INVALID';
export type WearableActivityLevel = 'INACTIVE' | 'LIGHT' | 'MODERATE' | 'VIGOROUS';
export type WearableMovementType = 'ROUTINE' | 'SUDDEN_MOVEMENT' | 'PROLONGED_INACTIVITY';
export type WearableSleepQuality = 'POOR' | 'FAIR' | 'RESTFUL' | 'OPTIMAL';
export type WearableAlertType =
  | 'SUDDEN_MOVEMENT'
  | 'PROLONGED_INACTIVITY'
  | 'POOR_SENSOR_QUALITY'
  | 'INVALID_READING'
  | 'DEVICE_DISCONNECTED'
  | 'SYNC_FAILED';
export type WearableAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type WearableAlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface WearableDevice {
  id: string;
  patient_id: string;
  pregnancy_id: string;
  device_name: string;
  device_model: string;
  mac_address_masked: string;
  battery_level?: number;
  connection_status: WearableConnectionStatus;
  last_synced_at?: string;
  firmware_version?: string;
  created_at: string;
  updated_at: string;
}

export interface WearableActivityRecord {
  id: string;
  patient_id: string;
  pregnancy_id: string;
  device_id: string;
  steps: number;
  active_duration_minutes: number;
  activity_level: WearableActivityLevel;
  recorded_at: string;
  synced_at?: string;
  sync_status: WearableSyncStatus;
  source: 'BLE' | 'WIFI' | 'MANUAL_IMPORT';
  created_at: string;
}

export interface WearableMovementRecord {
  id: string;
  patient_id: string;
  pregnancy_id: string;
  device_id: string;
  movement_event_type: WearableMovementType;
  intensity: number;
  duration_seconds: number;
  movement_timestamp: string;
  synced_at?: string;
  sync_status: WearableSyncStatus;
  source: 'BLE' | 'WIFI' | 'MANUAL_IMPORT';
  created_at: string;
}

export interface WearableSleepRecord {
  id: string;
  patient_id: string;
  pregnancy_id: string;
  device_id: string;
  sleep_start: string;
  sleep_end: string;
  total_duration_minutes: number;
  sleep_quality_estimate: WearableSleepQuality;
  recorded_at: string;
  synced_at?: string;
  sync_status: WearableSyncStatus;
  source: 'BLE' | 'WIFI' | 'MANUAL_IMPORT';
  created_at: string;
}

export interface WearableVitalsRecord {
  id: string;
  patient_id: string;
  pregnancy_id: string;
  device_id: string;
  heart_rate: number;
  spo2: number;
  signal_quality: SensorSignalQuality;
  measurement_timestamp: string;
  synced_at?: string;
  sync_status: WearableSyncStatus;
  source: 'BLE' | 'WIFI' | 'MANUAL_IMPORT';
  created_at: string;
}

export interface WearableAlert {
  id: string;
  patient_id: string;
  pregnancy_id: string;
  device_id: string;
  alert_type: WearableAlertType;
  severity: WearableAlertSeverity;
  title: string;
  message: string;
  status: WearableAlertStatus;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  source: string;
}


