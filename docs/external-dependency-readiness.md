# LifelineX — External Dependency Readiness Matrix

**Audit Date**: 2026-09-02  
**Standard**: Honest Staging & Pilot Reality Matrix (Zero Fabricated Completion)  

---

| # | Dependency | Purpose | Status | Exact Evidence | Owner | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Production Supabase Cloud** | Core Database, Auth, Realtime, Storage | `BLOCKED` | Staging migrations verified; production project not yet provisioned | DevOps Lead | Create production project on Supabase Cloud & run `supabase db push` |
| 2 | **SMS Gateway (Twilio/MSG91)** | Emergency SOS dispatch alerts & OTPs | `BLOCKED` | In-app pipeline verified; live API keys not added to Edge Secrets | Backend Lead | Purchase provider plan & set `TWILIO_ACCOUNT_SID` in Supabase Secrets |
| 3 | **Email Gateway (SendGrid/SES)** | Appointment & KYC verification emails | `BLOCKED` | In-app notifications active; email SMTP credentials pending | Backend Lead | Add `EMAIL_PROVIDER_API_KEY` to Edge Secrets |
| 4 | **Map Tile CDN (OSM / Mapbox)** | Base map rendering across 6 map views | `READY` | OpenStreetMap tile server integrated in `PatientMap`, `DonorMap`, etc. | Frontend Lead | Monitor tile latency during controlled pilot |
| 5 | **Device GPS Hardware** | Physical vehicle telemetry streaming | `PARTIALLY READY`| HTML5 Geolocation API verified; physical fleet hardware required | Fleet Lead | Test with 2 physical ambulance driver smartphones on road |
| 6 | **Partner Hospital MOU / DPA** | Clinical emergency reception consent | `BLOCKED` | Schema & RLS ready; hospital institutional agreement pending | BizDev / Legal | Execute bilateral DPA with pilot hospital facility |
| 7 | **Blood Bank NBTC License** | Statutory blood unit dispatch license | `BLOCKED` | Inventory atomic mutex tested; statutory blood center permit pending | Compliance Lead| Verify blood bank state license before clinical dispatch |
| 8 | **Ambulance Operator Permit** | Fleet emergency transit authorization | `PARTIALLY READY`| KYC admin verification workflow tested; physical transport permit pending | Transport Lead | Upload vehicle RC & fitness certificates to KYC queue |
| 9 | **DPDP Act Legal Filing** | India Data Protection compliance | `BLOCKED` | Consent architecture implemented; formal legal review pending | Legal Counsel | Submit Data Fiduciary registration to Data Protection Board |
| 10 | **Custom HTTPS Domain & TLS** | Production web address & cert | `BLOCKED` | Localhost & preview builds active; production DNS pending | DevOps Lead | Bind custom domain (e.g. `lifelinex.health`) to Vercel/Cloudflare |
| 11 | **Error Telemetry (Sentry / APM)** | Production crash reporting | `BLOCKED` | Application logs structured; Sentry DSN not yet wired in client | SRE Lead | Configure Sentry project and inject DSN via `.env.production` |
