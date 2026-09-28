# LifelineX — Phase 9 Ambulance Provider & Driver Onboarding Protocol

**Cluster Target**: Chennai Metro Healthcare Pilot  
**Standard**: Motor Vehicles Act 1988 (Emergency Vehicle Standards)  

---

## 1. Pilot Fleet Registration Inventory

| Vehicle Ref | Vehicle Model | Registration No. | Capabilities | Driver Name | Driver License No. | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AMB-TN-101** | Force Traveller ALS | `TN-01-EMG-101` | Advanced Life Support (ALS), Defibrillator, O2 | M. Ravi | `TN-01-2018-004921` | `PARTIALLY VERIFIED (Docs Uploaded)` |
| **AMB-TN-102** | Tata Winger BLS | `TN-01-EMG-102` | Basic Life Support (BLS), Transport, Stretcher | S. Kumar | `TN-02-2020-001844` | `PARTIALLY VERIFIED (Docs Uploaded)` |

---

## 2. Driver Physical Device & Telemetry Requirements

1. **Physical Mount**: Smartphones MUST be mounted on an in-vehicle dashboard cradle; handheld phone operation while steering is strictly prohibited.
2. **GPS Accuracy**: Device GPS must achieve `< 20m` horizontal accuracy before trip dispatch state advances to `EN_ROUTE`.
3. **Telemetry Frequency**: Position updates transmit every 10–15 seconds; server automatically discards records older than 30 seconds.
4. **Offline Resilience**: Local SQLite waypoint caching preserves coordinates during tunnel dead-zones without data corruption.
