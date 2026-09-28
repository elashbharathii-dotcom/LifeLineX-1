# LifelineX — System Architecture Document

## Overview
LifelineX is a unified, production-grade emergency healthcare coordination platform connecting Patients, Blood Donors, Hospitals, Blood Banks, Ambulance Providers, and Administrators in real-time.

```
                LIFELINEX
                     │
             ┌───────┴───────┐
             │               │
          FRONTEND        SUPABASE
             │               │
             │        ┌──────┼───────┐
             │        │      │       │
             │      AUTH   POSTGRES Storage
             │               │
             │              RLS
             │               │
             │        Edge Functions
             │               │
             │          Realtime
             │               │
             └───────┬───────┘
                     │
          ┌──────────┼───────────┐
          │          │           │
        MAPS        GPS      NOTIFICATIONS
          │
   ┌──────┼──────┬──────┬──────┐
   │      │      │      │      │
Patient Donor Hospital Blood Ambulance
  Map     Map    Map    Bank    Map
                          Map

                     +
                  Admin Map

                     +
                Lifeline AI
```

## Core Architectural Pillars
1. **Zero-Trust Role-Based Access Control (RBAC)**:
   - Server-verified roles: `PATIENT`, `DONOR`, `HOSPITAL_ADMIN`, `HOSPITAL_STAFF`, `BLOOD_BANK_ADMIN`, `BLOOD_BANK_STAFF`, `AMBULANCE_PROVIDER_ADMIN`, `AMBULANCE_DRIVER`, `LIFELINEX_ADMIN`, `SUPER_ADMIN`.
   - Granular PostgreSQL Row Level Security (RLS) policies for each table.

2. **Mode-Specific Map Isolation**:
   - `PatientMap`: Shows patient location, verified hospitals, blood banks, and assigned ambulance with ETA.
   - `DonorMap`: Shows approved donation centers and accepted destination routes without exposing patient or other donor exact coordinates.
   - `HospitalMap`: Shows incoming emergencies, ambulances, partner blood banks, and privacy-blurred donor candidate areas (~800m approximate radius).
   - `BloodBankMap`: Displays regional cold-chain hubs and hospital supply dispatch corridors.
   - `AmbulanceMap`: Driver cockpit displaying active assignment pickup waypoint, hospital destination, and live corridor.
   - `AdminMap`: Statewide network aggregate overview.

3. **Multi-Tier Donor Chain System**:
   - Batch invitation dispatches (Tier 1 -> Tier 2 -> Tier 3) with configurable countdown timers.
   - Automatic escalation to backup donors when an invitation is declined or timed out.
   - Transaction-safe commitment and facility confirmation.

4. **Real HTML5 Geolocation Telemetry**:
   - Live coordinate streaming via `navigator.geolocation.watchPosition`.
   - Continuous velocity, heading, and accuracy calculations with fallback mechanisms.

5. **Medical AI Coordination Guardrails**:
   - Non-diagnostic and non-prescriptive copilot.
   - Uses authorized backend tools for blood compatibility matrix verification, hospital triage routing, and inventory queries.
