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
