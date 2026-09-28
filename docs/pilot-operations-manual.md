# LifelineX — Controlled Pilot Operations Manual

**Classification**: Confidential Operations Manual  
**Scope**: Chennai Metro Healthcare Pilot Cluster  
**Version**: 1.0  

---

## 1. Pilot Scope & Constraints

- **Geographic Area**: Chennai Metro Cluster (12.8000°N–13.3000°N, 80.0000°E–80.4000°E)
- **Participant Capacity**:
  - Max concurrent active emergencies: `5`
  - Max concurrent donor chains: `3`
  - Partner hospitals: `1 Facility (Apollo Greams Road Cluster)`
  - Licensed blood banks: `1 Blood Center (Red Cross Central)`
  - Active pilot ambulances: `2 Vehicles (TN-01-EMG-101, TN-01-EMG-102)`

---

## 2. Daily Pilot Health Check Runbook

Every morning at 07:00 IST prior to shift handover, the SRE / On-call Lead executes:

- [ ] **Database Connectivity**: Health check endpoint returns `status === 'healthy'`.
- [ ] **RLS Verification**: Querying cross-tenant tables returns 0 rows.
- [ ] **Storage Buckets**: All 3 buckets have `public = FALSE`.
- [ ] **Map Tile CDN**: OpenStreetMap tile server latency `< 200ms`.
- [ ] **Ambulance Telemetry**: Test vehicle reports GPS position with timestamp age `< 15s`.
- [ ] **Emergency SOS**: Test dispatch successfully registers state `CREATED → LOCATION_CONFIRMED`.
- [ ] **Lifeline AI**: Test query confirms non-clinical disclaimer is rendered.

---

## 3. Incident Escalation Matrix

| Incident Severity | Trigger Event | Response Time | Action Owner |
| :--- | :--- | :--- | :--- |
| **P0 — Critical** | Emergency SOS failing to register in DB | `< 5 Minutes` | On-call SRE & Backend Lead |
| **P1 — High** | Ambulance telemetry stale (>30s) across all units | `< 15 Minutes` | Telemetry SRE |
| **P2 — Medium** | In-app notification delayed (>10s) | `< 1 Hour` | Full-Stack Lead |
| **P3 — Low** | Map icon misalignment or non-critical UI glitch | `< 24 Hours` | Frontend Lead |

---

## 4. Emergency Pilot Shutdown Procedure

In the event of an unrecoverable system defect or clinical safety concern:
1. **Disable Pilot Flag**: Set `isPilotActive: false` in `pilotConfig.ts`.
2. **Display Fallback Notice**: UI immediately transitions to direct telephony emergency dialing (`Call 108 / 112`).
3. **Notify Hospital Command**: On-call liaison calls the ER triage desk directly via telephone.
