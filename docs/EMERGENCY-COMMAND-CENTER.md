# LifelineX — Emergency Command Center 2.0 Architectural Specification

**Module**: Emergency Command Center 2.0 (`src/components/emergency/EmergencyTracker.tsx`)  
**Standard**: Real-Time Emergency Coordination & Trauma Dispatch Architecture  
**Target Viewports**: 320px (Mobile) to 2560px (Ultrawide)  

---

## 1. System Architecture & Data Flow

```
+-------------------------------------------------------------------------------+
|                       EMERGENCY COMMAND CENTER 2.0                            |
+-------------------------------------------------------------------------------+
| [1. Emergency Alert Header]  Session Code | Priority (CRITICAL) | Hotline 108 |
+-------------------------------------------------------------------------------+
| [2. State Stepper] CREATED ──► LOCATION_CONFIRMED ──► ... ──► COMPLETED       |
+-------------------------------------------------------------------------------+
|                                      |                                        |
|  [3. Live Telemetry Map Panel]       |  [4. Official Audit Timeline]          |
|  - Isolated PatientMap               |  - Real-time event log                 |
|  - GPS Stream & Velocity             |  - Role attribution                    |
|  - Stale detection (>30s)            |  - Timestamped chronological order     |
|                                      |                                        |
|  [5. Hospital Coordination Card]     |                                        |
|  - Verified KYC Badge                |                                        |
|  - ER Trauma Beds & ICU Ventilators  |                                        |
|  - Direct ER Hotline Link            |                                        |
|                                      |                                        |
|  [6. Ambulance Telematics Card]      |                                        |
|  - Vehicle Type & Status             |                                        |
|  - Live Heading & GPS Freshness      |                                        |
|  - ETA to Patient Location           |                                        |
|                                      |                                        |
|  [7. Blood Coordination Chain]       |                                        |
|  - Units Required / Fulfilled        |                                        |
|  - Matching Pipeline & Donor Tiers   |                                        |
+-------------------------------------------------------------------------------+
```

---

## 2. Role-Based Permissions & Scoping

| User Role | Map Scope | Action Permissions | Privacy Safeguards |
| :--- | :--- | :--- | :--- |
| **PATIENT** | Own location + assigned ambulance | View status, cancel emergency, call hotline | Cannot see other patients or donor exact coordinates |
| **HOSPITAL_STAFF** | Hospital node + inbound trauma patients | Triage patient, update bed readiness, request blood | Cannot modify unrelated hospital inventories |
| **AMBULANCE_DRIVER** | Assigned emergency pickup + route | Update trip state (En Route, Arrived), stream GPS | Cannot see other ambulance dispatches |
| **LIFELINEX_ADMIN** | Regional cluster overview | Supervise dispatch, intervene in stale sessions | Full audit logging on any administrative intervention |

---

## 3. Real-Time Telemetry & Fail-Safe Mechanisms

1. **GPS Freshness Boundary**:
   - Updates within ≤ 30s are marked `Live Active (HTML5 GPS)`.
   - Telemetry older than 30s transitions to `Location update unavailable (stale >30s)`.
2. **Emergency Fallback Hotlines**:
   - `Call 108 Hotline` and `Call 112` are permanently docked in the header.
   - If GPS is denied or connection drops, manual landmark entry and direct telephone dispatch activate automatically.
3. **Blood Coordination & Donor Chain**:
   - Aggregate candidate counts are displayed (Contacted, Responses, Units secured).
   - Donor candidates are obfuscated (`Donor Candidate #1 (Privacy Obfuscated)`).
