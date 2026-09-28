# LifelineX — Ambulance Live GPS Architecture Specification

**Module**: Ambulance Live GPS & Telematics Ingestion (`src/services/ambulanceService.ts`)  
**Components**: `AmbulanceDriverView.tsx`, `AmbulanceFleetDashboard.tsx`, `AmbulanceMap.tsx`  
**Standard**: High-Precision Telemetry Ingestion, IDOR Protection & Freshness Classification  

---

## 1. End-to-End Telemetry Data Pipeline

```
[Driver Mobile Device]
        │ (HTML5 Geolocation watchPosition)
        ▼
[Driver Cockpit UI]
        │ (POST /streamDriverGPS with correlation token)
        ▼
[Ambulance Service Ingestion Engine]
        ├─► 1. Coordinate Boundary Guard (Lat [-90, +90], Lon [-180, +180])
        ├─► 2. Speed Plausibility (≤ 180 km/h) & Teleportation Jump Check
        ├─► 3. IDOR Ownership Check (driver.assigned_ambulance_id === payload.ambulanceId)
        └─► 4. Battery Optimization & Deduplication Check
        │
        ▼ (Atomic Database Update)
[PostgreSQL ambulances / ambulance_locations Table]
        │
        ▼ (Scoped Real-Time WebSocket Channel)
[Authorized Consumers]
        ├─► Patient (Assigned Ambulance Marker & ETA)
        ├─► Hospital (Trauma Readiness & Inbound Telematics)
        ├─► Fleet Provider (Fleet Grid & Driver Allocation)
        └─► Dispatcher / Admin (Regional Incident Overview)
```

---

## 2. Multi-Tier Freshness Classification Matrix

| Category | Telemetry Age ($\Delta t$) | UI Status Display | Operational SLA |
| :--- | :--- | :--- | :--- |
| **LIVE** | $\Delta t \le 15\text{ s}$ | `Live Active (HTML5 GPS)` | Normal active routing & real-time ETA |
| **RECENT** | $16\text{ s} < \Delta t \le 30\text{ s}$ | `Recent (Xs ago)` | Route valid, slight delay in GPS transmission |
| **STALE** | $31\text{ s} < \Delta t \le 60\text{ s}$ | `Location may be outdated` | ETA invalidated; display *"ETA updating..."* |
| **OFFLINE**| $\Delta t > 60\text{ s}$ | `Location signal lost (>60s)` | Operator alert triggered; telephone dispatch recommended |
