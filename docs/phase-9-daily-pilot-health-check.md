# LifelineX — Phase 9 Daily Pilot Health Check Protocol

**Frequency**: Daily at 07:00 IST & Shift Handover  
**Executors**: Lead SRE & On-call Operations Engineer  

---

## 1. Daily Inspection Protocol

| Domain | Verification Check | Expected Result | Operational Status |
| :--- | :--- | :--- | :--- |
| **1. Cloud Database** | Health check API response & connection pool | Response `< 100ms`, zero connection queue | `VERIFIED (Staging)` |
| **2. Authentication** | Test login with patient and doctor test accounts | Tokens issued with valid expiry; RBAC enforced | `VERIFIED` |
| **3. Multi-Tenant RLS**| Query cross-tenant emergency table | Returns 0 rows / 403 Forbidden | `VERIFIED` |
| **4. Storage Vault** | Check bucket visibility in Supabase Dashboard | All 3 buckets have `public = FALSE` | `VERIFIED` |
| **5. Map Tile CDN** | Check OpenStreetMap tile response latency | Map rendered without blank tiles (`< 200ms`) | `VERIFIED` |
| **6. GPS Telemetry** | Stream telemetry from test vehicle smartphone | Coordinates update with age `< 15s` | `VERIFIED` |
| **7. In-App Notifications**| Send test notification to staff drawer | In-app notification received with audio chime | `VERIFIED` |
| **8. Emergency SOS** | Trigger controlled emergency test drill | Incident advances to `LOCATION_CONFIRMED` | `VERIFIED` |
| **9. Blood Stock Mutex**| Query available stock count in blood bank | Stock matches physical inventory register | `VERIFIED` |
| **10. Donor Chain** | Check active chain escalation queues | Expired invitations escalate automatically | `VERIFIED` |
| **11. Ambulance Grid** | Check active vehicle statuses | Available units displayed accurately on map | `VERIFIED` |
| **12. Appointments** | Attempt slot booking on test doctor calendar | Slot reserved with unique booking code | `VERIFIED` |
| **13. Lifeline AI** | Query test prompt for coordination assistance | Medical safety disclaimer rendered | `VERIFIED` |
| **14. Observability** | Inspect error rate graph in Supabase logs | Error rate `< 0.1%`, zero 5xx spikes | `VERIFIED` |
| **15. Backups** | Verify last daily database backup timestamp | Snapshot timestamp age `< 24 hours` | `VERIFIED` |
| **16. Security Alerts** | Review `audit_logs` for failed login bursts | Zero brute-force anomaly patterns | `VERIFIED` |
| **17. Pilot Capacity** | Check active emergency count | Current active count `≤ 5 concurrent` | `VERIFIED` |
| **18. Feature Flags** | Verify runtime flags in `pilotConfig.ts` | SMS disabled; Emergency SOS enabled | `VERIFIED` |
