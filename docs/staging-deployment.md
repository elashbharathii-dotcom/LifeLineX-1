# LifelineX — Staging Deployment Guide & Infrastructure Runbook

**Target**: Dedicated Staging Project (Supabase + Vercel / Cloudflare Pages)  
**Classification**: Operational Engineering Manual  

---

## 1. Staging Environment Checklist

Before triggering a staging deployment, verify:
- [x] All 5 SQL migrations exist in `supabase/migrations/` in sequential order.
- [x] `.env.staging` has `VITE_APP_ENV=staging` configured.
- [x] All 11 Deno Edge Functions compile cleanly.
- [x] Zero live production credentials present in source control.
- [x] Storage buckets initialized as private (`public = FALSE`).

---

## 2. Step-by-Step Staging Provisioning

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Authenticate and link to Staging Supabase Project
supabase login
supabase link --project-ref your-staging-project-ref

# 3. Apply Schema & Stored Procedures
supabase db push

# 4. Deploy 11 Edge Functions
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

# 5. Build Staging Frontend Bundle
npm run build

# 6. Deploy to Staging Preview
npx vercel --cwd . --prod=false
```

---

## 3. Rollback Procedure

In the event of an operational defect discovered during staging tests:
1. **Frontend**: Revert to the previous build hash in Vercel / Cloudflare Pages dashboard with zero downtime.
2. **Database Schema**: Revert via explicit down migration (never run `db reset` on staging with active test records).
3. **Edge Functions**: Redeploy the previous version using `supabase functions deploy <fn>`.
