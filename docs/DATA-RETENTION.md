# LifelineX — Data Retention & Lifecycle Management Policy

**Standard**: India Digital Personal Data Protection (DPDP) Act 2023 / ISO 27799 Healthcare Information  

---

## 1. Data Classification & Retention Periods

| Category | Data Elements Included | Retention Period | Post-Expiry Action | Legal / Compliance Rationale |
| :--- | :--- | :---: | :--- | :--- |
| **Emergency SOS Records** | Emergency ID, timestamps, hospital triage notes, ambulance ID | **7 Years** | Secure Cold Archive | Clinical audit & medical liability standard |
| **Ambulance Live GPS** | Raw sub-minute latitude/longitude trajectory pings | **24 Hours** | **AUTOMATIC PURGE** | Data minimization & anti-surveillance privacy |
| **Audit Logs** | Actor ID, role, action, target entity, timestamp | **3 Years** | Read-Only Cold Storage | SOC 2 / HIPAA compliance audit trail |
| **Verification Documents** | Hospital licenses, doctor certificates, vehicle permits | **Duration of Affiliation + 1 Year** | Permanent Cryptographic Deletion | Legal authorization tracking |
| **Notification Logs** | Channel (SMS/in-app), delivery timestamp, status | **90 Days** | Automated Rolling Prune | Cost and database storage optimization |
| **Temporary Files** | Thumbnail caches, signed URL transient tokens | **24 Hours** | Automated Daily Cron Cleanup | Transient storage management |
