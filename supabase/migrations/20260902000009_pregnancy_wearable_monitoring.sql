-- LIFELINEX POSTGRESQL SCHEMA MIGRATION: 009_pregnancy_wearable_monitoring.sql
-- Pregnancy-Only Wearable Monitoring System (ESP32 + MAX30102 + MPU6050)
-- Strict Patient Ownership & Linked-Hospital-Only RLS Policies

-- 1. WEARABLE DEVICES
CREATE TABLE IF NOT EXISTS wearable_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pregnancy_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL DEFAULT 'LifelineX Maternal Monitor',
    device_model VARCHAR(100) NOT NULL DEFAULT 'ESP32-MAX30102-MPU6050',
    mac_address_masked VARCHAR(32) NOT NULL,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    connection_status VARCHAR(32) NOT NULL DEFAULT 'DISCONNECTED' CHECK (connection_status IN ('CONNECTED', 'DISCONNECTED', 'PAIRING')),
    last_synced_at TIMESTAMPTZ,
    firmware_version VARCHAR(32) DEFAULT 'v1.4.2-rel',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wearable_devices_patient ON wearable_devices(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_pregnancy ON wearable_devices(pregnancy_id);

-- 2. WEARABLE ACTIVITY RECORDS (Steps, Active Time)
CREATE TABLE IF NOT EXISTS wearable_activity_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pregnancy_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
    steps INTEGER NOT NULL DEFAULT 0,
    active_duration_minutes INTEGER NOT NULL DEFAULT 0,
    activity_level VARCHAR(32) NOT NULL DEFAULT 'LIGHT' CHECK (activity_level IN ('INACTIVE', 'LIGHT', 'MODERATE', 'VIGOROUS')),
    recorded_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(32) NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('LOCAL_ONLY', 'PENDING_SYNC', 'SYNCED', 'SYNC_FAILED')),
    source VARCHAR(32) NOT NULL DEFAULT 'BLE' CHECK (source IN ('BLE', 'WIFI', 'MANUAL_IMPORT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wearable_activity_patient ON wearable_activity_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_activity_pregnancy ON wearable_activity_records(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_wearable_activity_recorded_at ON wearable_activity_records(recorded_at);

-- 3. WEARABLE MOVEMENT RECORDS (MPU6050 Accelerometer/Gyro)
CREATE TABLE IF NOT EXISTS wearable_movement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pregnancy_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
    movement_event_type VARCHAR(32) NOT NULL DEFAULT 'ROUTINE' CHECK (movement_event_type IN ('ROUTINE', 'SUDDEN_MOVEMENT', 'PROLONGED_INACTIVITY')),
    intensity NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    movement_timestamp TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(32) NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('LOCAL_ONLY', 'PENDING_SYNC', 'SYNCED', 'SYNC_FAILED')),
    source VARCHAR(32) NOT NULL DEFAULT 'BLE' CHECK (source IN ('BLE', 'WIFI', 'MANUAL_IMPORT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wearable_movement_patient ON wearable_movement_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_movement_pregnancy ON wearable_movement_records(pregnancy_id);

-- 4. WEARABLE SLEEP RECORDS
CREATE TABLE IF NOT EXISTS wearable_sleep_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pregnancy_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
    sleep_start TIMESTAMPTZ NOT NULL,
    sleep_end TIMESTAMPTZ NOT NULL,
    total_duration_minutes INTEGER NOT NULL,
    sleep_quality_estimate VARCHAR(32) NOT NULL DEFAULT 'RESTFUL' CHECK (sleep_quality_estimate IN ('POOR', 'FAIR', 'RESTFUL', 'OPTIMAL')),
    recorded_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(32) NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('LOCAL_ONLY', 'PENDING_SYNC', 'SYNCED', 'SYNC_FAILED')),
    source VARCHAR(32) NOT NULL DEFAULT 'BLE' CHECK (source IN ('BLE', 'WIFI', 'MANUAL_IMPORT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wearable_sleep_patient ON wearable_sleep_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_sleep_pregnancy ON wearable_sleep_records(pregnancy_id);

-- 5. WEARABLE VITALS RECORDS (MAX30102 PPG: Heart Rate & SpO2)
CREATE TABLE IF NOT EXISTS wearable_vitals_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pregnancy_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
    heart_rate INTEGER NOT NULL CHECK (heart_rate >= 30 AND heart_rate <= 240),
    spo2 NUMERIC(5,2) NOT NULL CHECK (spo2 >= 50.0 AND spo2 <= 100.0),
    signal_quality VARCHAR(32) NOT NULL DEFAULT 'GOOD' CHECK (signal_quality IN ('GOOD', 'FAIR', 'POOR', 'INVALID')),
    measurement_timestamp TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ,
    sync_status VARCHAR(32) NOT NULL DEFAULT 'SYNCED' CHECK (sync_status IN ('LOCAL_ONLY', 'PENDING_SYNC', 'SYNCED', 'SYNC_FAILED')),
    source VARCHAR(32) NOT NULL DEFAULT 'BLE' CHECK (source IN ('BLE', 'WIFI', 'MANUAL_IMPORT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_wearable_vitals_patient ON wearable_vitals_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_vitals_pregnancy ON wearable_vitals_records(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_wearable_vitals_timestamp ON wearable_vitals_records(measurement_timestamp);

-- 6. WEARABLE ALERTS (Sensor Quality, Inactivity, Sudden Movement)
CREATE TABLE IF NOT EXISTS wearable_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pregnancy_id UUID NOT NULL REFERENCES pregnancy_profiles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(32) NOT NULL CHECK (alert_type IN ('SUDDEN_MOVEMENT', 'PROLONGED_INACTIVITY', 'POOR_SENSOR_QUALITY', 'INVALID_READING', 'DEVICE_DISCONNECTED', 'SYNC_FAILED')),
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    source VARCHAR(64) NOT NULL DEFAULT 'WEARABLE_DEVICE'
);

CREATE INDEX IF NOT EXISTS idx_wearable_alerts_patient ON wearable_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_wearable_alerts_pregnancy ON wearable_alerts(pregnancy_id);
CREATE INDEX IF NOT EXISTS idx_wearable_alerts_status ON wearable_alerts(status);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_activity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_movement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_vitals_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_alerts ENABLE ROW LEVEL SECURITY;

-- 8. PATIENT OWNERSHIP POLICIES
CREATE POLICY patient_wearable_devices_policy ON wearable_devices
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY patient_wearable_activity_policy ON wearable_activity_records
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY patient_wearable_movement_policy ON wearable_movement_records
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY patient_wearable_sleep_policy ON wearable_sleep_records
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY patient_wearable_vitals_policy ON wearable_vitals_records
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

CREATE POLICY patient_wearable_alerts_policy ON wearable_alerts
    FOR ALL USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- 9. LINKED HOSPITAL-ONLY READ POLICIES (Clinical staff can ONLY read patients linked to THEIR hospital)
CREATE POLICY hospital_wearable_devices_read_policy ON wearable_devices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pregnancy_profiles pp
            JOIN hospital_staff hs ON hs.hospital_id = pp.hospital_id
            WHERE pp.id = wearable_devices.pregnancy_id
              AND hs.profile_id = auth.uid()
              AND hs.is_active = true
        )
    );

CREATE POLICY hospital_wearable_activity_read_policy ON wearable_activity_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pregnancy_profiles pp
            JOIN hospital_staff hs ON hs.hospital_id = pp.hospital_id
            WHERE pp.id = wearable_activity_records.pregnancy_id
              AND hs.profile_id = auth.uid()
              AND hs.is_active = true
        )
    );

CREATE POLICY hospital_wearable_movement_read_policy ON wearable_movement_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pregnancy_profiles pp
            JOIN hospital_staff hs ON hs.hospital_id = pp.hospital_id
            WHERE pp.id = wearable_movement_records.pregnancy_id
              AND hs.profile_id = auth.uid()
              AND hs.is_active = true
        )
    );

CREATE POLICY hospital_wearable_sleep_read_policy ON wearable_sleep_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pregnancy_profiles pp
            JOIN hospital_staff hs ON hs.hospital_id = pp.hospital_id
            WHERE pp.id = wearable_sleep_records.pregnancy_id
              AND hs.profile_id = auth.uid()
              AND hs.is_active = true
        )
    );

CREATE POLICY hospital_wearable_vitals_read_policy ON wearable_vitals_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pregnancy_profiles pp
            JOIN hospital_staff hs ON hs.hospital_id = pp.hospital_id
            WHERE pp.id = wearable_vitals_records.pregnancy_id
              AND hs.profile_id = auth.uid()
              AND hs.is_active = true
        )
    );

CREATE POLICY hospital_wearable_alerts_read_policy ON wearable_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pregnancy_profiles pp
            JOIN hospital_staff hs ON hs.hospital_id = pp.hospital_id
            WHERE pp.id = wearable_alerts.pregnancy_id
              AND hs.profile_id = auth.uid()
              AND hs.is_active = true
        )
    );
