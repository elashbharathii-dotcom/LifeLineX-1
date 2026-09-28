# LifelineX — Ambulance Security, IDOR & Concurrency Test Verification

**Test Suite**: `tests/ambulance-gps-realtime-suite.js`  
**Pass Rate**: **10 / 10 Tests Passed (100%)**  

---

## 1. Test Assertions & Security Results

| Test ID | Objective | Threat Model / Defense Mechanism | Result |
| :--- | :--- | :--- | :---: |
| **AMB-01**| Linear State Progression | Traverses full 6-stage lifecycle (`REQUESTED` to `COMPLETED`) | `PASS` |
| **AMB-02**| Invalid Transition Rejection | Rejects illegal shortcuts (e.g., `REQUESTED` directly to `COMPLETED`) | `PASS` |
| **AMB-03**| Coordinate Bounding | Rejects latitude > 90° or longitude > 180° | `PASS` |
| **AMB-04**| Speed Plausibility | Flags and rejects vehicle speeds > 180 km/h | `PASS` |
| **AMB-05**| Driver IDOR Ownership | Driver A attempting to inject GPS for Driver B's ambulance is rejected | `PASS` |
| **AMB-06**| Dual Driver Mutex | Two drivers claiming the same request produces exactly one winner | `PASS` |
| **AMB-07**| GPS Freshness Classification | Correctly categorizes LIVE (≤15s), RECENT (≤30s), STALE (≤60s), OFFLINE (>60s) | `PASS` |
| **AMB-08**| Non-Fabricated ETA Math | Real Haversine math; returns *"ETA unavailable"* when stationary or route missing | `PASS` |
| **AMB-09**| Route Scoping | Patient isolated to assigned vehicle without route leakage | `PASS` |
| **AMB-10**| Audit Logging | Every status transition and GPS rejection is recorded in audit logs | `PASS` |
