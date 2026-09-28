# LifelineX — Ambulance Dispatch & Operations Runbook

**Audience**: Emergency Response Operators, Fleet Supervisors, SRE Incident Responders  

---

## 1. Operating Procedures

### Scenario A: Driver GPS Signal Lost During Transit
1. If GPS is flagged `OFFLINE (>60s)`, the system prompts: *"Location signal lost (>60s)"*.
2. Dispatcher clicks `Call Driver` in `AmbulanceFleetDashboard.tsx` to establish direct voice contact.
3. If cellular connection is fully degraded, dispatcher invokes backup dispatch via municipal `108 / 112` trunk lines.

### Scenario B: Vehicle Breakdown En Route
1. Driver marks `CANCELLED` with reason `VEHICLE_MECHANICAL_FAILURE`.
2. System immediately releases active emergency session into `SEARCHING` status and cascades dispatch alert to the next nearest available ALS/BLS unit.
3. Audit log records incident ID, odometer reading, and mechanical reason code.
