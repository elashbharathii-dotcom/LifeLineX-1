# LifelineX — Supabase Integration Guide

## Overview
LifelineX uses Supabase for Auth, PostgreSQL Database, Storage, and Realtime WebSocket subscriptions.

## Environment Variables
Create `.env` based on `.env.example`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running Migrations
To apply the migrations to your Supabase project:
```bash
supabase db push
# or using psql
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260902000001_core_schema.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260902000002_rls_policies.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260902000003_triggers_and_functions.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/migrations/20260902000004_seed_data.sql
```

## Realtime Replication
The following tables are published to `supabase_realtime`:
- `emergency_sessions`
- `emergency_events`
- `ambulance_locations`
- `ambulance_requests`
- `blood_requests`
- `donor_chains`
- `donor_chain_members`
- `notifications`
- `blood_inventory`
