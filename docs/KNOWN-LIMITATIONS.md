# LifelineX — Known Operational Limitations & Mitigations

**Evaluation Standard**: Zero Fabricated Production Claims  
**Date**: 2026-09-02  

---

## 1. External Infrastructure Dependencies (Blocked)

1. **Production Supabase Cloud Instance**:
   - *Limitation*: Cloud PostgreSQL instance not yet provisioned by DevOps/Finance.
   - *Mitigation*: 5 sequential migrations ready in `supabase/migrations/`; validated on local/staging database.
2. **SMS / Telephony Gateway (Twilio / MSG91)**:
   - *Limitation*: Live provider credentials not injected into production secret vault.
   - *Mitigation*: In-app notification drawer and fallback telephone dialing (`Call 108 / 112`) active.
3. **Hospital Bilateral DPA / MOU**:
   - *Limitation*: Hospital Command Center ready in code, but physical signoff pending with partner institutions.
   - *Mitigation*: Staged pilot rollout limited to Chennai Healthcare Cluster.
4. **Blood Bank Regulatory Permit (NBTC)**:
   - *Limitation*: Statutory blood bank inspection pending with government authority.
   - *Mitigation*: Controlled pilot operates in supervised training/shadow mode.
5. **India DPDP Act 2023 Filing**:
   - *Limitation*: Formal Data Fiduciary registration filing pending legal review.
   - *Mitigation*: Consent tables and 30-day retention policies implemented in software.
