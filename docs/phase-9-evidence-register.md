# LifelineX — Phase 9 Evidence Register & Traceability Log

**Standard**: High-Assurance Evidence Register (Zero Fabricated IDs)  
**Evidence Levels**:
- **LEVEL 0**: Code exists in repository.
- **LEVEL 1**: Automated test passed in CI/CD.
- **LEVEL 2**: Staging environment validated.
- **LEVEL 3**: Real external service / physical device connected.
- **LEVEL 4**: Authorized supervised pilot validated with real participants.

---

| ID | Domain | Test / Procedure | Environment | Evidence Level | Result | Evidence File / Reference | Owner |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **EV-901** | Production Build | Vite production build compile | Build Engine | `LEVEL 1` | `✓ Built (594ms, 0 errors)` | `dist/assets/index-DXEB5U0S.js` | Frontend Lead |
| **EV-902** | 10-Role RBAC | Server-enforced `user_roles` query test | Staging DB | `LEVEL 2` | `Client elevation rejected (403)` | `tests/run-backend-suite.js` | Security Lead |
| **EV-903** | Multi-Tenant RLS | Cross-tenant IDOR attack simulation | Staging DB | `LEVEL 2` | `0 rows returned / 403 Forbidden` | `tests/phase-3-e2e-suite.js` | Database Lead |
| **EV-904** | Inventory Mutex | 3 concurrent 6-unit requests on 10 units | Staging DB | `LEVEL 2` | `1 succeeded, 2 rejected (0 negative)` | `tests/phase-4-comprehensive-suite.js` | Database Lead |
| **EV-905** | GPS Telemetry | Browser Geolocation prompt granted | Live Browser | `LEVEL 3` | `High-accuracy GPS coordinates streamed` | `src/services/locationService.ts` | Mobile Lead |
| **EV-906** | GPS Fallback | Browser Geolocation prompt denied | Live Browser | `LEVEL 3` | `LOCATION_UNAVAILABLE safely rendered` | `src/components/emergency/EmergencyButton.tsx` | Full-Stack Lead |
| **EV-907** | Map Tile CDN | OpenStreetMap tile server requests | Live Browser | `LEVEL 3` | `Tile CDN HTTP 200 responses (<200ms)` | `src/components/maps/PatientMap.tsx` | Frontend Lead |
| **EV-908** | Storage Vault | 5-minute signed tokenized URL expiry | Staging Vault | `LEVEL 2` | `Access rejected after token expiry` | `tests/phase-5-staging-suite.js` | Security Lead |
| **EV-909** | AI Guardrails | Prescription / dosage prompt injection | Staging Edge Fn | `LEVEL 2` | `Refused with physician referral` | `supabase/functions/lifeline-ai/index.ts` | AI Safety Lead |
| **EV-910** | Pilot Geofence | Query inside vs outside Chennai cluster | Pilot Service | `LEVEL 2` | `Inside allowed; outside blocked safely` | `src/services/pilotConfig.ts` | DevSecOps Lead |
| **EV-911** | Partner Hospital | Hospital Command Center triage drill | Staging UI | `LEVEL 2` | `ER triage queue & bed allocation verified` | `src/components/hospital/HospitalCommandCenter.tsx` | Clinical Liaison |
| **EV-912** | Secret Scan | Runtime environment validator & AST scan | Client Runtime | `LEVEL 2` | `0 private keys or service tokens in bundle` | `src/services/envValidator.ts` | SRE Lead |
