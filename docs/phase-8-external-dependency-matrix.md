# LifelineX — Phase 8 External Dependency Readiness Matrix

**Date**: 2026-09-02  
**Evidence Levels**: Level 0 (Code Exists) · Level 1 (Test Passed) · Level 2 (Staging Validated) · Level 3 (Real Service Connected) · Level 4 (Pilot Validated)  

---

| Dependency | Evidence Level | Status | Exact Evidence | Owner | Blocker | Next Action |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Supabase Cloud Production** | `LEVEL 2` | `BLOCKED` | Staging schema & 5 migrations verified; cloud instance not provisioned | DevOps Lead | Cloud project required | Provision Supabase project & apply migrations |
| **SMS / OTP Gateway** | `LEVEL 2` | `BLOCKED` | In-app notification active; live Twilio / MSG91 API keys not injected | Backend Lead | Provider API keys | Inject live SMS credentials into Supabase Vault |
| **Partner Hospital MOU** | `LEVEL 2` | `EXTERNAL DEPENDENCY` | Hospital Command Center verified; bilateral DPA pending | BizDev / Legal | Institutional agreement | Execute clinical reception consent with pilot hospital |
| **Blood Bank License** | `LEVEL 2` | `EXTERNAL DEPENDENCY` | Atomic inventory mutex verified; statutory NBTC license pending | Compliance Lead| Regulatory license | Inspect blood center NBTC permit prior to dispatch |
| **Ambulance Driver Devices**| `LEVEL 3` | `PARTIALLY VERIFIED` | HTML5 Geolocation API active; physical vehicle mounting pending | Fleet Lead | Vehicle installation | Install dashboard mounts in 2 pilot ambulances |
| **Map Tile CDN (OSM)** | `LEVEL 3` | `VERIFIED` | OpenStreetMap tile CDN actively serving tiles in 6 maps | Frontend Lead | None | Monitor CDN latency during live pilot |
| **India DPDP Act Compliance**| `LEVEL 0` | `LEGAL REVIEW REQUIRED`| Consent tables & retention policy implemented in code | Legal Counsel | Statutory filing | Submit Data Fiduciary registration to DPB of India |
| **Production HTTPS Domain** | `LEVEL 0` | `BLOCKED` | Preview builds active; production DNS binding pending | DevOps Lead | DNS provisioning | Bind custom domain with TLS to Vercel/Cloudflare |
