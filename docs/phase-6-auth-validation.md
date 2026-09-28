# LifelineX — Phase 6 Authentication & Role Onboarding Validation

**Audit Date**: 2026-09-02  
**Standard**: ISO 27799 / OWASP ASVS Level 3 Authentication & Session Management  

---

## 1. 10-Role Matrix & Operational Scope

| Role | Target Identity | Operational Boundary | Restrictive Server Gate |
| :--- | :--- | :--- | :--- |
| **PATIENT** | General public / Emergency user | Trigger SOS, view assigned hospital/ambulance, book personal appointments | Cannot view other patients, hospital internal logs, or admin queues |
| **DONOR** | Volunteer blood donor | Toggle availability, accept/decline donor chain invites, view donation history | Cannot view patient identity or unassigned hospital records |
| **HOSPITAL_ADMIN** | Hospital Medical Director / Head | Manage hospital staff, triage incoming emergencies, allocate beds | Scoped exclusively to own registered `hospital_id` |
| **HOSPITAL_STAFF** | ER Doctor / Triage Nurse | View allocated patient vitals, request blood units, dispatch ambulance | Scoped to patient encounters at own facility |
| **BLOOD_BANK_ADMIN** | Blood Center Director | Manage blood stock, approve unit release, configure collection drives | Scoped to own blood bank facility |
| **BLOOD_BANK_STAFF** | Lab Technician / Phlebotomist | Update component units, log test results, reserve emergency stock | Scoped to own blood bank facility |
| **AMBULANCE_PROVIDER_ADMIN** | Fleet Operator | Register vehicles, assign drivers, view fleet utilization | Scoped to own licensed fleet |
| **AMBULANCE_DRIVER** | Paramedic / Ambulance Driver | Stream live GPS telemetry, advance trip state (EN_ROUTE → ARRIVED) | Scoped exclusively to actively assigned trip |
| **LIFELINEX_ADMIN** | Platform Operations Lead | Review KYC verifications (hospitals, blood banks, ambulances), monitor health | Multi-facility read/verification; cannot modify clinical medical charts |
| **SUPER_ADMIN** | System Architecture Lead | Manage system parameters, rotate emergency nodes, audit security logs | Full system supervision; subject to immutable audit logging |

---

## 2. Authentication Flow & IDOR Attack Defense

```
[Client Login / Session Check]
        │
        ▼
[Supabase Auth (JWT Signed by RS256)]
        │
        ├── Verified Claim (auth.uid())
        │
        ▼
[Database user_roles Lookup]
        │
        ├── If role matches required permission → PERMIT
        └── If client claims elevated role not in user_roles → DISCARD & REJECT (403)
        │
        ▼
[PostgreSQL Row Level Security (RLS)]
        │
        ├── SELECT / INSERT / UPDATE / DELETE restricted by auth.uid() & facility_id
        └── Cross-tenant IDOR read/write attempts → RETURN 0 ROWS / 403 FORBIDDEN
```
