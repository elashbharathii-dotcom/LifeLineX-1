# LifelineX — External Dependencies Register

**Last Updated**: 2026-09-02

All items listed here are architecturally integrated in code. Activation requires external provider accounts, credentials, or third-party agreements.

---

| # | Dependency | Purpose | Interface Layer | Status | Required Action |
| :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Supabase Production Project** | PostgreSQL DB, Auth, Realtime, Storage | `supabaseClient.ts` | **BLOCKED** | Create production Supabase project; set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.production` |
| 2 | **Supabase Service Role Key** | Edge Function admin operations, verification processing | `process-verification` Edge Function (server-side only) | **BLOCKED** | Add `SUPABASE_SERVICE_ROLE_KEY` to Edge Function secrets vault (never frontend) |
| 3 | **SMS Gateway (Twilio / MSG91)** | OTP authentication, donor alerts, appointment reminders | `notificationService.ts` → Edge Function `send-notification` | **BLOCKED** | Obtain API credentials; integrate in `send-notification` Edge Function |
| 4 | **Device GPS Hardware** | Real ambulance driver telemetry; patient emergency location | `locationService.ts` + `update-ambulance-location` Edge Function | **PARTIALLY READY** | HTML5 Geolocation API active in browser; physical Android/iOS hardware required for production fleet vehicles |
| 5 | **Aadhaar Authentication (UIDAI)** | Donor and hospital identity verification | `process-verification` Edge Function | **BLOCKED** | UIDAI Authentication User Agency (AUA/KUA) license required |
| 6 | **Hospital Partner Agreements** | Formal data processing consent; emergency coordination authorization | Legal / compliance layer | **BLOCKED** | Signed MOU with each participating hospital; DPA under DPDP Act |
| 7 | **Blood Bank Authorization** | NBTC + State Drug Controller licensing for clinical unit dispatch | Legal / compliance layer | **BLOCKED** | NBTC authorization + state-level blood bank registration |
| 8 | **Ambulance Provider Licensing** | State transport authority permits; vehicle registration | Admin verification workflow | **PARTIALLY READY** | Admin KYC review workflow implemented; physical licensing is external |
| 9 | **Production Domain + TLS** | HTTPS for all API and frontend traffic | Deployment / DNS | **BLOCKED** | Purchase domain; configure HTTPS cert (Let's Encrypt / Cloudflare) |
| 10 | **Production Monitoring** | Error tracking, latency alerts, uptime monitoring | Observability layer | **BLOCKED** | Configure Sentry / Datadog / equivalent in production |
| 11 | **Email Provider (SendGrid / SES)** | Account verification emails, appointment confirmations | `notificationService.ts` | **BLOCKED** | Email provider API key required |
| 12 | **DPDP Act Compliance Filing** | Legal requirement before processing live patient data | Legal / Government | **BLOCKED** | Data Fiduciary Registration with Data Protection Board of India |
