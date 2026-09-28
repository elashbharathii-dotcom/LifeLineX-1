# LifelineX — Phase 10 Production Rollback & Emergency Disablement Validation

**Classification**: Emergency SRE & Incident Response Runbook  
**Target Recovery Window**: `< 15 Minutes (P0)`  

---

## 1. Rollback Vectors & Step-by-Step Procedures

### A. Application Frontend Rollback
- **Hosting Platform**: Vercel / Cloudflare Pages
- **Procedure**: Navigate to Deployments → Select previous verified stable deployment hash → Click **Instant Rollback**.
- **Downtime**: `0 seconds` (instant atomic DNS pointer shift).

### B. Feature Flag & Emergency Deactivation
- **Mechanism**: `src/services/pilotConfig.ts`
- **Procedure**: Set `isPilotActive: false` or disable specific flags (`enableEmergencySOS: false`, `enableSmsNotifications: false`).
- **Effect**: UI renders a static notice directing users to physical emergency telephone lines (`Call 108 / 112`).

### C. Edge Function Rollback
- **Mechanism**: Supabase CLI
- **Procedure**: Redeploy the previous version from Git commit hash via `supabase functions deploy <fn>`.

### D. Database Migration Rollback Strategy
- **Mechanism**: Sequential down-migrations (Never execute `db reset` on production).
- **Procedure**: Apply targeted reverse schema scripts while preserving existing `audit_logs` records.
