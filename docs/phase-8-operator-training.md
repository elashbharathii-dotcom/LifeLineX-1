# LifelineX — Phase 8 Operator Training & Role Readiness Plan

**Target Audience**: Controlled Pilot Participants (Chennai Metro Healthcare Cluster)  
**Standard**: Clinical Coordination & Operational Safety Guidelines  

---

## 1. Role-Specific Training Curriculum

| Role | Module Focus | Critical Safety Instructions | Assessment Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PATIENT** | Emergency SOS trigger, triage notes, map tracking | LifelineX does NOT replace 108/112; call 108 immediately if connection fails | Interactive onboarding walkthrough | `VERIFIED (Staging)` |
| **DONOR** | Availability toggling, donor chain accept/decline | "Potential Donor Match" indicates eligibility check needed at blood bank | In-app pilot consent briefing | `VERIFIED (Staging)` |
| **HOSPITAL STAFF** | Command Center triage, blood requests, ambulance call | Verify patient identity physically upon ambulance bay arrival | Simulation drill at ER workstation | `READY FOR PILOT` |
| **BLOOD BANK STAFF**| Stock updates, atomic reservation, quarantine | Never release units without physical cross-match & barcode scan | Blood center SOP walk-through | `READY FOR PILOT` |
| **AMBULANCE DRIVER**| Driver cockpit, state stepper (EN_ROUTE → ARRIVED) | Never operate smartphone while steering; mount device on dashboard | Vehicle cockpit dry-run | `READY FOR PILOT` |
| **LIFELINEX ADMIN** | KYC verification queues, audit logs, pilot capacity | Immediately halt pilot if safety anomaly occurs (`pilotConfig.ts`) | SRE operational runbook review | `VERIFIED` |

---

## 2. Operator Signoff Checklist

- [ ] Every pilot operator acknowledges that LifelineX operates under **Controlled Pilot Conditions**.
- [ ] Emergency fallback telephone contacts (`108 / 112 / ER Direct`) are physically posted at every workstation.
- [ ] Operators are instructed never to input real patient clinical charts into non-authorized text fields.
