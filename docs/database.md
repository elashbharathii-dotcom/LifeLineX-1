# LifelineX — Database Schema & Migration Guide

## Database Overview
The LifelineX PostgreSQL database is normalized to 3NF, uses UUID primary keys, and includes check constraints, foreign keys, indexes, triggers, and comprehensive Row Level Security (RLS).

## Schema Migrations
All migrations are located in `supabase/migrations/`:
1. `20260902000001_core_schema.sql`: Core tables, ENUM types, and performance indexes.
2. `20260902000002_rls_policies.sql`: Granular Row Level Security for every table.
3. `20260902000003_triggers_and_functions.sql`: Haversine distance, blood compatibility rules, inventory audit triggers, and Realtime publications.
4. `20260902000004_seed_data.sql`: Realistic development seed data.

## Key Tables
- `profiles`: Master identity and profile information.
- `user_roles`: Multi-role RBAC grants.
- `donor_profiles`: Blood group, availability (`AVAILABLE`, `BUSY`, `PAUSED`), and privacy settings.
- `hospitals`: Emergency departments, ICU bed capacity (`icu_beds_available`, `total_icu_beds`).
- `blood_banks`: Cold-chain hubs with configurable low-stock thresholds.
- `blood_inventory`: Group & component inventory with automated change logging.
- `blood_requests`: Official hospital requests with urgency levels (`CRITICAL`, `HIGH`, etc.).
- `donor_chains` & `donor_chain_members`: Multi-tier batch invitations with response timeouts.
- `ambulances` & `drivers`: Vehicle registry and real-time telemetry state.
- `emergency_sessions` & `emergency_events`: Emergency state machine and timeline events.
- `appointments`: Doctor consultations and donation slots with conflict checks.
- `audit_logs`: Tamper-evident mutation records.
