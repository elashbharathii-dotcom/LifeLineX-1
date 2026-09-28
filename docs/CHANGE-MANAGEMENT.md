# LifelineX — Change Management & Feature Governance Protocol

**Standard**: Healthcare Software Quality & Change Management (ISO 13485 / IEC 62304 / SOC 2 Type II)  
**Governance Scope**: All software modifications, database migrations, configuration changes, and feature additions.  

---

## 1. Change Lifecycle

```
[1. FEATURE RFC]       ──► Author submits RFC using `FEATURE-RFC-TEMPLATE.md`
        │
[2. RISK CLASSIFICATION]──► SRE Lead & Safety Officer categorize Risk (LOW / MEDIUM / HIGH)
        │
[3. DESIGN & REVIEW]   ──► Security, Privacy, Accessibility, and Clinical Architecture Review
        │
[4. IMPLEMENTATION]    ──► Feature branch created; code adheres to strict TypeScript & linter rules
        │
[5. CONTINUOUS TESTING]──► 100% pass on automated regression suite (`npm.cmd test`)
        │
[6. STAGING VALIDATION] ──► E2E verification on staging database
        │
[7. APPROVAL]          ──► Dual sign-off (SRE Lead + Clinical Safety Director)
        │
[8. CANARY ROLLOUT]    ──► 10% progressive deployment via `canaryController.ts`
        │
[9. MONITORING]        ──► Live SLO burn-rate tracking via `sloManager.ts` & `telemetryService.ts`
        │
[10. POST-RELEASE]     ──► Outcome review & quality scorecard update
```

---

## 2. Change Risk Tiers

| Tier | Definition | Examples | Review & Approval Requirement |
| :--- | :--- | :--- | :--- |
| **LOW** | Cosmetic UI refinements, static copy fixes | Color contrast tweaks, typography polish | 1 Senior Frontend Engineer |
| **MEDIUM** | Standard API enhancements, new query filters | Non-clinical dashboard charts, export filters | 1 Senior Engineer + QA Lead |
| **HIGH** | Core emergency workflows, auth, RLS, GPS, clinical AI, blood inventory, ambulance dispatch | Emergency state machine changes, PostgreSQL migrations, AI prompt updates | SRE Lead + Clinical Director + Security Engineer |

---

## 3. Mandatory Requirements for Every High-Risk Change

Every change classified as **HIGH** must explicitly document:
1. **Clinical & Operational Safety Impact**: Verification that medical decisions remain with authorized human clinicians.
2. **Security & Data Isolation**: RLS policy review preventing cross-tenant IDOR attacks.
3. **Data Protection & Privacy**: Verification that no PII, Aadhaar numbers, or raw GPS trajectories leak into client bundles or logs.
4. **Rollback Strategy**: Pre-validated zero-downtime rollback mechanism (feature flag toggle or database rollback script).
5. **Automated Test Coverage**: New automated test assertions verifying both happy-path and failure-mode conditions.
