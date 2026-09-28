# LifelineX — Production Supabase Infrastructure Runbook

**Environment Target**: Dedicated Production Supabase Project  
**Status**: `BLOCKED — External Production Project Creation Required`  
**Author**: Principal Cloud & Database Architect  

---

## 1. Migration Determinism & Sequence

Migrations MUST be applied sequentially without modification:

```
1. supabase/migrations/20260902000001_core_schema.sql
   ↳ Creates 30+ tables (profiles, hospitals, blood_inventory, emergency_sessions, etc.)
   ↳ Defines indexes, foreign keys, unique constraints, and check bounds

2. supabase/migrations/20260902000002_rls_policies.sql
   ↳ Enables ALTER TABLE ... ENABLE ROW LEVEL SECURITY across 18 sensitive tables
   ↳ Establishes tenant isolation and cross-user read/write protection

3. supabase/migrations/20260902000003_triggers_and_functions.sql
   ↳ Creates automated audit triggers, timestamp updater functions, and verification handlers

4. supabase/migrations/20260902000004_seed_data.sql (STAGING ONLY)
   ⚠️ DO NOT RUN ON PRODUCTION — Staging seed data contains demo records.

5. supabase/migrations/20260902000005_concurrency_and_storage.sql
   ↳ Creates private storage buckets (donor-documents, hospital-licenses, medical-records)
   ↳ Installs atomic stored procedures: reserve_blood_inventory_atomic, book_appointment_slot_atomic, assign_ambulance_driver_atomic
```

---

## 2. Production Provisioning Commands

```bash
# 1. Login to Supabase Cloud
supabase login

# 2. Link to Production Reference (obtain from Supabase Dashboard)
supabase link --project-ref <PROD_PROJECT_REF>

# 3. Push Migrations (Excluding 004 seed on production)
supabase db push

# 4. Deploy 11 Edge Functions with Production Vault Secrets
supabase functions deploy create-emergency
supabase functions deploy create-blood-request
supabase functions deploy assign-ambulance
supabase functions deploy match-donors
supabase functions deploy start-donor-chain
supabase functions deploy process-donor-response
supabase functions deploy update-ambulance-location
supabase functions deploy book-appointment
supabase functions deploy send-notification
supabase functions deploy lifeline-ai
supabase functions deploy process-verification

# 5. Set Production Secrets in Supabase Vault
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<PROD_SERVICE_ROLE_KEY>"
supabase secrets set TWILIO_ACCOUNT_SID="<PROD_TWILIO_SID>"
supabase secrets set TWILIO_AUTH_TOKEN="<PROD_TWILIO_TOKEN>"
supabase secrets set EMAIL_PROVIDER_API_KEY="<PROD_EMAIL_KEY>"
```

---

## 3. Database Backup & Point-in-Time Recovery (PITR)

| Backup Layer | Configuration | Retention | Target |
| :--- | :--- | :--- | :--- |
| **Automated Daily Backups** | Daily pg_dump snapshot at 02:00 UTC | 30 days | S3 cold bucket |
| **Point-in-Time Recovery (PITR)**| Continuous WAL archiving via Supabase Pro | 7 days continuous | Replay to any second |
| **Private Document Snapshots** | Weekly storage bucket mirror | 90 days | Encrypted multi-region backup |
