# LifelineX — Disaster Recovery & Business Continuity Plan

**Standard**: ISO 22301 Business Continuity / ISO 27799 Health Informatics Disaster Recovery  
**Target RTO (Recovery Time Objective)**: `< 15 Minutes (P0)`  
**Target RPO (Recovery Point Objective)**: `< 60 Minutes (Database Delta)`  

---

## 1. Backup Strategy

| Component | Frequency | Storage Location | Retention | Encryption |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Full Backup** | Daily at 02:00 IST | Multi-region Cold Storage | 30 Days | AES-256 |
| **PostgreSQL WAL Logs (PITR)** | Continuous | Encrypted S3 bucket | 7 Days | AES-256 |
| **Document Storage Vault** | Cross-region replicated | 3 Private S3 Buckets | 90 Days | AES-256 |
| **Source Code & Migrations** | Per commit (Git) | GitHub Private Repo | Indefinite | SSH / 2FA |

---

## 2. Recovery Procedure

1. **Detection & Triage**: SRE detects region-wide outage or irrecoverable data corruption.
2. **Declaration**: SRE Lead issues DR declaration to `#emergency-command`.
3. **Infrastructure Provisioning**:
   ```bash
   supabase db reset --linked
   supabase db push
   ```
4. **Point-in-Time Restore (PITR)**:
   - Restore database to the closest safe WAL timestamp prior to disaster.
5. **Sanity Verification**:
   - Execute test suite: `npm test`
   - Verify zero cross-tenant IDOR leak via `tests/phase-3-e2e-suite.js`.
6. **DNS Failover**: Update Route53 / Cloudflare DNS records to point to restored instance.
7. **Post-Recovery Verification**: Health aggregator confirms `overallStatus: healthy`.

---

## 3. External Dependency Status & Honest Classification

| Service / Integration | Status | Detail / Action Required |
| :--- | :--- | :--- |
| **Supabase Production** | `CONFIGURED` | Supabase client and schema/RLS configured with fallback to mock/local mode if unreachable |
| **Google Maps Platform** | `CONFIGURED` | API key configured with strict map fallback when key is unassigned or quota exceeded |
| **SMS / OTP Provider (Twilio/AWS SNS)** | `BLOCKED` | Awaiting corporate telecom aggregator credentials and DLT registration |
| **Payment Provider (Razorpay/Stripe)** | `BLOCKED` | Awaiting merchant bank account verification and production API keys |
| **Telemedicine (Google Meet / WebRTC)** | `BLOCKED` | Awaiting Google Workspace OAuth app verification for auto-provisioned meeting links |
| **Production Monitoring (Sentry/Datadog)** | `NOT CONFIGURED` | Application logging operational; external APM agent pending enterprise subscription |

