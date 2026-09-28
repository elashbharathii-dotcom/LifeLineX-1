# LifelineX — Sensitive Data Classification, Retention & Privacy Governance

**Governing Standard**: India Digital Personal Data Protection (DPDP) Act 2023 / ISO 27799  
**Status**: Technical Architecture Implemented — `LEGAL/REGULATORY REVIEW REQUIRED`  

---

## 1. Data Classification Inventory

| Data Category | Specific Elements | Classification | Storage Vault | Retention Policy | Erasure / Anonymization |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Identity Data** | Full Name, Phone, Email | `Sensitive Personal` | `profiles` (PostgreSQL RLS) | Account lifetime | Anonymized on account deletion |
| **National ID / KYC** | Aadhaar Verification Status, Masked Ref | `Critical PII` | Verification tables (No raw Aadhaar) | 5 years (statutory audit requirement) | Purged after audit window |
| **Emergency Telemetry**| High-precision GPS latitude / longitude | `Sensitive Personal` | `emergency_sessions`, `emergency_telemetry` | 90 days post-incident | Coordinates blurred to city-level |
| **Health & Blood Data**| Blood Group, Donation History, Deferrals | `Special Health Data` | `donor_profiles`, `blood_requests` | Account lifetime | Preserved for clinical traceability |
| **Medical Documents** | Scanned lab reports, discharge summaries | `Confidential Medical` | Private storage bucket (`medical-records`) | Duration of medical encounter | Deleted upon patient revocation |
| **Organizational KYC** | Hospital licenses, Blood bank permits | `Enterprise Official` | Private bucket (`hospital-licenses`) | Active operational partnership | Retained for 7 years |
| **System Audit Logs** | Actor ID, Action, Entity, Timestamp | `System Security` | `audit_logs` (Append-only RLS) | 365 days minimum | Archived to cold storage |

---

## 2. DPDP Act 2023 Legal Requirements Status

> [!IMPORTANT]
> Technical safeguards and consent toggles are fully operational in code. However, statutory compliance under Indian law requires the following non-technical actions:

1. **Data Fiduciary Registration**: Formal submission to the Data Protection Board (DPB) of India. (`LEGAL REVIEW REQUIRED`)
2. **Patient Consent Notice**: Multi-lingual statutory consent notice (English, Tamil, Hindi) vetted by healthcare legal counsel. (`LEGAL REVIEW REQUIRED`)
3. **Data Protection Officer (DPO)**: Formal designation of an India-resident DPO. (`LEGAL REVIEW REQUIRED`)
