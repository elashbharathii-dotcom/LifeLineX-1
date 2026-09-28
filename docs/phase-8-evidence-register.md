# LifelineX — Phase 8 Pilot Evidence Register

**Standard**: Formal Audit & Traceability Log (Zero Fabricated IDs)  

---

| Evidence ID | Domain | Date | Test / Validation Procedure | Environment | Actor | Result | Evidence Level | Operational Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **EV-001** | GPS Telemetry | 2026-09-02 | Device GPS permission granted & accuracy check | Staging Browser | Patient Session | High accuracy coordinates locked | `LEVEL 3` | `VERIFIED` |
| **EV-002** | GPS Fallback | 2026-09-02 | Browser location permission denied by user | Staging Browser | Patient Session | `LOCATION_UNAVAILABLE` rendered safely | `LEVEL 3` | `VERIFIED` |
| **EV-003** | Stale GPS Filter | 2026-09-02 | Inbound telemetry timestamp age > 45 seconds | Staging Backend | Driver Service | Stale record rejected with 422 error | `LEVEL 2` | `VERIFIED` |
| **EV-004** | Inventory Mutex | 2026-09-02 | 3 concurrent 6-unit requests on 10 units | Staging DB | ER Doctor Staff | Exactly 1 succeeded; 0 negative stock | `LEVEL 2` | `VERIFIED` |
| **EV-005** | Donor Chain | 2026-09-02 | Tier 1 candidate timeout after 10m window | Staging Backend | Donor Service | Tier 2 activated; 0 duplicate donors | `LEVEL 2` | `VERIFIED` |
| **EV-006** | AI Guardrails | 2026-09-02 | Medical prescription & dosage prompt attempt | Staging Edge Fn | Test Patient | Refused with physician referral warning | `LEVEL 2` | `VERIFIED` |
| **EV-007** | IDOR Defense | 2026-09-02 | Patient A requesting Patient B emergency record | Staging DB | Patient Session | PostgREST returned 0 rows (403 forbidden) | `LEVEL 2` | `VERIFIED` |
| **EV-008** | Storage Vault | 2026-09-02 | 5-minute signed tokenized URL expiration test | Staging Storage | Security Lead | URL access rejected after expiry timestamp | `LEVEL 2` | `VERIFIED` |
| **EV-009** | Secret Shield | 2026-09-02 | Client bundle static analysis & runtime scan | Production Build | CI/CD Scanner | 0 service role keys or private secrets in bundle | `LEVEL 2` | `VERIFIED` |
| **EV-010** | Geofence Bounds | 2026-09-02 | Coordinate query inside vs outside Chennai cluster | Pilot Service | Pilot Runner | Inside permitted; outside blocked safely | `LEVEL 2` | `VERIFIED` |
