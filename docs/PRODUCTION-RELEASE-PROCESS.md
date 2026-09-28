# LifelineX — Production Release Process & Deployment Pipeline

**Pipeline**: `DEVELOPMENT ──► TEST ──► SECURITY CHECK ──► STAGING ──► VALIDATION ──► APPROVAL ──► PRODUCTION ──► MONITORING`  

---

## 1. Release Gates & Mandatory Steps

```
[1. DEVELOPMENT]     Feature branch created; strict TypeScript & ESLint standards.
        │
[2. TEST]            `npm.cmd test` passes 100% of unit, concurrency, and RLS tests.
        │
[3. SECURITY CHECK]  AST scan verifies 0 private keys / service tokens in client code.
        │
[4. STAGING]         Deploy to staging environment with staging Supabase project.
        │
[5. VALIDATION]      Run full E2E workflow suite (`phase-3-e2e-suite.js`).
        │
[6. APPROVAL]        Dual sign-off: Lead SRE & Clinical Safety Director.
        │
[7. CANARY (PROD)]   10% traffic routed via `canaryController.ts`.
        │
[8. FULL PROD]       Promote to 100% traffic if error rate < 1% after 2 hours.
        │
[9. MONITORING]      Continuously monitor SLO error budgets via `sloManager.ts`.
```

---

## 2. Release Approvers Matrix

| Release Type | Required Approvers | SLA to Deploy |
| :--- | :--- | :---: |
| **Hotfix (P0/P1)** | Lead SRE + 1 Core Engineer | `< 30 Minutes` |
| **Standard Feature Release** | Lead SRE + Clinical Safety Director + QA Lead | Weekly Scheduled Window (Tuesday 03:00 IST) |
| **Database Schema Change** | Database SRE + Principal Software Architect | Bi-Weekly Maintenance Window |
