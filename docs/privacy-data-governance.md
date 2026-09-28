# LifelineX — Privacy & Data Governance Policy

**Document Status**: Technical Controls Implemented — Formal Legal Review Required Before Live Pilot  
**Applies To**: All LifelineX environments (development, staging, production)

---

> [!IMPORTANT]
> Technical privacy controls described here are implemented in code. However, **operational legal compliance** under the India Digital Personal Data Protection (DPDP) Act 2023 and health data regulations requires formal legal counsel review and government filings before live patient data is processed.

---

## 1. Data Classification

| Data Type | Classification | Storage | Retention | Access |
| :--- | :--- | :--- | :--- | :--- |
| Patient name, contact | **Sensitive Personal** | `profiles` table (RLS) | Account lifetime | Self + authorized staff |
| Patient GPS emergency coordinates | **Sensitive Personal** | `emergency_sessions` (RLS) | 90 days post-completion | Self + assigned hospital + admin |
| Donor blood group, availability | **Health Data** | `donor_profiles` (RLS) | Account lifetime | Self + verified hospitals (anonymized) |
| Donor home coordinates | **Sensitive Personal** | `donor_profiles` (private) | Never exposed exactly | Obfuscated ~800m for hospital view |
| Aadhaar / National ID | **Critical PII** | NOT stored raw — verification status only | Verification metadata | Admin reviewer only |
| Medical records, lab reports | **Medical Data** | Private storage bucket | Per legal requirement | Authorized medical staff only |
| Hospital licenses | **Organizational** | Private storage bucket | Verification period | Admin + hospital admin |
| Audit logs | **System** | `audit_logs` (append-only RLS) | 1 year minimum | Admin read-only |

---

## 2. Consent Management

- Explicit GPS consent is requested before any location operation. Denial results in `LOCATION_UNAVAILABLE` status with no fallback fabrication.
- Donor availability is toggled by the donor explicitly — no default-on enrollment.
- Notification permissions are configurable per user in the notification preferences panel.
- Consent records are stored in the `consents` table with timestamp, version, and scope.

---

## 3. Data Minimization

- Donor home address is never stored as a precise text field. Only approximate coordinates are used for distance-based matching.
- Aadhaar numbers are never stored. Only a verification status (`VERIFIED`, `PENDING`, `REJECTED`), masked reference, reviewer ID, and timestamps are kept.
- Emergency session GPS coordinates are retained for 90 days post-completion for audit trail purposes, then anonymized.

---

## 4. Individual Rights (DPDP Act 2023 Compliance)

| Right | Technical Implementation | Status |
| :--- | :--- | :--- |
| **Right to Access** | User can view own profile, emergency history, appointments via authenticated queries | Implemented |
| **Right to Correction** | Profile update UI + authenticated PATCH via service layer | Implemented |
| **Right to Erasure** | Account deactivation + data anonymization workflow | Architecture Defined |
| **Right to Portability** | Export endpoint architecture specified | NOT IMPLEMENTED |
| **Right to Object** | Notification opt-out in preferences | Implemented |

---

## 5. Legal & Compliance Blockers

> [!CAUTION]
> The following require formal legal/regulatory approval before live patient data may be processed:

1. **Data Fiduciary Registration** under DPDP Act 2023 — Must be filed with Data Protection Board of India.
2. **Health Data Processing Notice** — Patient-facing privacy notice must be reviewed by qualified health data privacy counsel.
3. **Aadhaar Verification Partnership** — Requires UIDAI-authorized authentication partner agreement.
4. **Hospital MOU** — Formal data processing agreements with each partner hospital before accessing patient records.
5. **Blood Bank Authorization** — NBTC and State Drug Controller authorization before clinical unit dispatch.
