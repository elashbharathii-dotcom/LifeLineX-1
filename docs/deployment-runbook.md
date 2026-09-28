# LifelineX — Deployment Runbook

**Target**: Controlled Staging Pilot Deployment  
**Prerequisites**: Review `docs/external-dependencies.md` and resolve all BLOCKED items first

---

## Step 1: Create Supabase Production Project

```bash
# 1. Go to https://supabase.com → New Project
# 2. Choose region closest to pilot hospitals (e.g., ap-south-1 for India)
# 3. Enable Row Level Security globally (Projects → Settings → Database → RLS)
# 4. Copy: Project URL, Anon Key → paste into .env.production
```

## Step 2: Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push all 5 migrations
supabase db push

# Verify tables were created
supabase db remote commit --dry-run
```

Migrations to run in order:
1. `20260902000001_core_schema.sql`
2. `20260902000002_rls_policies.sql`
3. `20260902000003_triggers_and_functions.sql`
4. `20260902000004_seed_data.sql` *(staging only — remove for production)*
5. `20260902000005_concurrency_and_storage.sql`

## Step 3: Configure Private Storage Buckets

```bash
# Buckets are created by migration 005
# Verify via Supabase Dashboard → Storage:
# - donor-documents: private ✓
# - hospital-licenses: private ✓
# - medical-records: private ✓
```

## Step 4: Deploy Edge Functions

```bash
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

# Set Edge Function secrets (NEVER commit these)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 5: Production Build & Deployment

```bash
# Verify environment
cp .env.production .env

# Run full validation suite before deploy
node tests/verify-all.js
node tests/run-backend-suite.js
node tests/phase-3-e2e-suite.js
node tests/phase-4-comprehensive-suite.js

# TypeScript check + production build
npm run build

# Deploy to Vercel (recommended)
npx vercel --prod

# OR deploy to Cloudflare Pages
# Connect GitHub repo → set build command: npm run build → output: dist
```

## Step 6: Post-Deployment Smoke Tests

```bash
# 1. Verify HTTPS — no mixed content warnings
# 2. Test login with a staging account
# 3. Verify emergency creation writes to Supabase
# 4. Verify ambulance map loads (no console errors)
# 5. Verify notification drawer opens
# 6. Check Supabase Dashboard → Logs for Edge Function invocations
```

## Rollback Procedure

```bash
# Vercel: dashboard → Deployments → select previous → Promote to Production
# Database: Supabase Dashboard → Database → Backups → Restore
# Migrations: supabase db reset (staging ONLY — NEVER run on production)
```

## Secure Headers (Recommended)

Add to `vercel.json` or Nginx config:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(self)" }
      ]
    }
  ]
}
```
