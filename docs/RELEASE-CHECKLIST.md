# LifelineX — Pre-Deployment & Release Checklist

**Release Target**: Production Deployment / Controlled Pilot Rollout  
**Standard**: SOC 2 / HIPAA / Healthcare Continuous Delivery Checklist  

---

## 1. Automated Verification Checks (Mandatory Pre-Conditions)

- [x] **0 TypeScript Errors**: `npm.cmd run typecheck` passes with zero errors.
- [x] **0 Build Failures**: `npm.cmd run build` finishes cleanly (`dist/` created).
- [x] **0 Critical Lint Warnings**: `npm.cmd run lint` confirms clean syntax.
- [x] **100% Test Pass Rate**: `npm.cmd test` and all regression suites pass.
- [x] **0 Leaked Secrets**: AST scan confirms no service-role keys or private tokens in client bundle.

---

## 2. Infrastructure & Environment Checks

- [ ] **Production Supabase Project**: Provisioned and linked via Supabase CLI. (`BLOCKED`)
- [ ] **Database Migrations**: 5 sequential migrations applied in production.
- [ ] **Storage Buckets**: 3 private buckets created with RLS (`donor-documents`, `hospital-licenses`, `medical-records`).
- [ ] **SMS Gateway Credentials**: Live Twilio / MSG91 API credentials injected into Vault. (`BLOCKED`)
- [ ] **Bilateral Hospital DPA**: Physical DPA signed by medical director. (`BLOCKED`)

---

## 3. Post-Deployment Verification (Smoke Test)

- [ ] Verify homepage loads at production HTTPS domain (`200 OK`).
- [ ] Verify test login for Patient, Hospital, Blood Bank, and Ambulance Driver.
- [ ] Verify Emergency SOS button renders without layout shifts.
- [ ] Verify 6 Mode-Specific Maps load tiles without 403 errors.
- [ ] Verify Lifeline AI answers feature questions while refusing medical prescriptions.
- [ ] Verify Telemetry Service logs structured entries with correlation IDs.
- [ ] Start 10% canary traffic via `canaryController.startCanary()`.
