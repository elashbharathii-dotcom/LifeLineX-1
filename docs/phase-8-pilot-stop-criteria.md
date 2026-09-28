# LifelineX — Phase 8 Pilot Stop & Immediate Pause Criteria

**Authority**: Lead SRE, Security Engineer & Healthcare Safety Lead  

---

## 1. Mandatory Pilot Stop Conditions

The controlled pilot MUST be immediately paused or shut down if ANY of the following occur:

1. **Critical Security Vulnerability**: Unresolved RLS bypass, SQL injection, or unauthenticated stored procedure execution.
2. **Unauthorized Cross-Tenant Exposure**: Patient medical records or donor home locations visible to unauthorized third parties.
3. **Emergency SOS Silent Failure**: An emergency request fails to persist or notify assigned hospital without immediate fallback alert.
4. **Fabricated Telemetry / State**: Any component displays artificial vehicle movement or fake blood inventory in production mode.
5. **AI Clinical Decision Violation**: AI copilot attempts to prescribe medication or diagnose medical conditions autonomously.
6. **Double Dispatch / Concurrency Breach**: Multiple ambulances dispatched to same request or blood inventory drops below zero.
7. **Severe Database / Realtime Outage**: Supabase Cloud database unavailable for > 15 minutes without recovery.
8. **Uncontrolled Notification Storm**: Infinite loops or duplicate spamming of SMS/in-app notifications to users.
9. **Inability to Enforce Pilot Limits**: Active emergencies exceed configured capacity limit (`> 5 concurrent`).
10. **Statutory Regulatory Injunction**: Formal notice from health authorities or Data Protection Board.
11. **Clinical Safety Concern**: Partner hospital ER director requests suspension due to clinical discrepancy.
12. **Driver Safety Hazard**: Driver mobile app interface causes vehicle distraction or telemetry reporting crash.

---

## 2. Emergency Shutdown Action

If any stop condition is triggered, the SRE executes:
```bash
# Set pilot active flag to false
# System immediately renders static fallback notice directing users to Call 108 / 112
```
