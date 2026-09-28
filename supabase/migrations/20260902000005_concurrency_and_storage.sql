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
