# LifelineX — Phase 11 Production Operations Runbook

**Environment Target**: Production Supabase Cloud + Edge Runtime  

---

## 1. Production Deployment Commands

```bash
# 1. Authenticate to Supabase Cloud
supabase login

# 2. Link to Production Reference
supabase link --project-ref <PROD_PROJECT_REF>

# 3. Apply Schema & Stored Procedures
supabase db push

# 4. Deploy 11 Edge Functions with Vault Secrets
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

# 5. Build and Deploy Frontend
npm run build
npx vercel --prod
```
