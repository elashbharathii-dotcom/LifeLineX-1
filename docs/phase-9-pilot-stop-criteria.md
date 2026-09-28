# LifelineX — Phase 9 Pilot Stop Criteria & Emergency Safeguards

**Authority**: Lead SRE, Security Engineer & Clinical Safety Director  

---

## 1. Mandatory Pilot Stop Conditions

The supervised pilot MUST be paused immediately upon encountering ANY of the following triggers:

1. **Life-Safety Dispatch Failure**: An emergency request fails to transmit to the assigned hospital triage desk without immediate fallback alert.
2. **Unauthorized Cross-Tenant Data Exposure**: Any patient medical record or donor home address visible to unassigned third parties.
3. **Severe Concurrency Failure**: Blood inventory dropping below zero or multiple ambulances dispatched to a single emergency request.
4. **AI Autonomy Violation**: Lifeline AI attempting clinical diagnosis, drug prescriptions, or autonomous ambulance dispatches.
5. **Fabricated Telemetry Leak**: System displaying synthetic GPS coordinates or mock blood units in production/pilot mode.
6. **Active Emergency Over-Capacity**: Concurrent active emergencies exceeding the pilot safety ceiling (`> 5 concurrent`).
7. **Database Availability Breach**: Supabase database unavailable for `> 15 minutes` during operational hours.
8. **Statutory Regulatory Injunction**: Formal regulatory order from health authorities or the Data Protection Board.
9. **Partner Clinical Suspension**: Hospital ER director requesting immediate pause due to clinical discrepancy.
10. **Driver Mobile App Crash Loop**: Ambulance driver application crashing during live emergency transit.

---

## 2. Immediate Safe Fallback Protocol

```bash
# SRE sets isPilotActive = false in pilotConfig.ts
# System immediately renders static fallback notice directing users to Call 108 / 112 directly
```
