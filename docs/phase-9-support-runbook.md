# LifelineX — Phase 9 Support Runbook & Operational Procedures

**Audience**: Pilot Operations Team, SRE On-call, Healthcare Liaison  

---

## 1. Support Tiers & Escalation Paths

| Tier | Role / Team | Responsibility | Response SLA | Contact Channel |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (L1)** | User Operations Desk | General onboarding, password reset help, app navigation | `< 15 Minutes` | In-app help desk / chat |
| **Tier 2 (L2)** | Technical Operations SRE | GPS connection drops, map tile rendering delays, app crashes | `< 30 Minutes` | Operations Slack / Pager |
| **Tier 3 (L3)** | Core Engineering & DevSecOps | Database locking issues, RLS policy errors, Edge Function bugs | `< 15 Minutes (P0)` | PagerDuty On-Call Schedule |
| **Emergency Ops** | Healthcare Liaison | Hospital ER staff communications, ambulance re-routing | `< 5 Minutes (P0)` | Dedicated Hotwire Phone Line |
| **Security Lead** | DevSecOps Lead | Data breach alerts, rogue token invalidation, RLS bypass | `< 10 Minutes (P0)` | Security Incident Hotline |
| **AI Safety Lead** | AI Systems Engineer | Prompt jailbreak attempts, hallucination anomalies | `< 1 Hour` | AI Safety Operations Channel |
