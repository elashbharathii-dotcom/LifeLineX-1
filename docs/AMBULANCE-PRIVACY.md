# LifelineX — Ambulance Geolocation & Telemetry Privacy Architecture

**Standard**: Data Minimization & Protected Health Information (PHI) Geofencing  

---

## 1. Role-Specific Data Isolation

1. **Patient View**:
   - Only sees the single assigned emergency vehicle.
   - Cannot see driver home location or unrelated emergency requests.
2. **Driver View**:
   - Only sees assigned patient pickup and target trauma hospital.
   - Medical details limited to operational severity (`CRITICAL`, `SEVERE`, `MODERATE`) and basic notes needed for paramedic stabilization.
3. **Location Retention**:
   - Real-time GPS stream coordinates are automatically purged after 24 hours per the data retention policy (`DATA-RETENTION.md`).
   - Incident summary metrics (pickup time, arrival time, total distance) are retained in the permanent audit trail.
