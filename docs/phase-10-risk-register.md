# LifelineX — Phase 10 Final Risk Register

**Standard**: ISO 31000 Risk Management Standard  

---

| Risk | Severity | Probability | Impact | Mitigation | Owner | Status |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **Unprovisioned Production Cloud DB** | `HIGH` | `HIGH` | System cannot serve live production users | Dedicated Supabase Cloud project provisioning | DevOps Lead | `BLOCKED` |
| **Missing SMS Gateway Credentials** | `MEDIUM` | `HIGH` | Emergency alerts limited to in-app drawer | Inject Twilio / MSG91 API credentials into Vault | Backend Lead | `BLOCKED` |
| **Partner Hospital DPA Delay** | `HIGH` | `MEDIUM` | Delays clinical reception of live trauma alerts | Execute bilateral DPA with pilot hospital administration | BizDev / Legal | `EXTERNAL DEPENDENCY` |
| **Blood Center Statutory Permit** | `HIGH` | `LOW` | Regulatory delay in live blood unit dispatch | Verify NBTC license before clinical dispatch | Compliance Lead| `EXTERNAL DEPENDENCY` |
| **Ambulance Driver Telemetry Drop** | `MEDIUM` | `MEDIUM` | Temporary map track interruption in dead zones | Stale GPS filter (>30s rejected) + local waypoint cache | Telemetry SRE | `MITIGATED` |
| **Donor Unresponsiveness during SOS** | `LOW` | `MEDIUM` | Emergency blood matching delay | Automated multi-tier chain escalation without duplicates | Backend Lead | `MITIGATED` |
| **AI Prescription / Diagnostic Drift** | `HIGH` | `LOW` | Unsafe medical recommendations | Multi-layer heuristic filters + server context scoping | AI Safety Lead | `MITIGATED` |
| **Cross-Tenant IDOR Attack** | `CRITICAL` | `LOW` | Data leak between unrelated patients or hospitals | PostgreSQL Row Level Security enforced on 18 tables | Database SRE | `MITIGATED` |
| **DPDP Act Regulatory Non-Compliance**| `HIGH` | `LOW` | Statutory penalty under Indian data protection law | Submit Data Fiduciary registration to DPB of India | Legal Counsel | `LEGAL REVIEW REQUIRED` |
