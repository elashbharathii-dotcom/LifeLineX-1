# LifelineX — Blameless Incident Postmortem Template

**Standard**: Google SRE Blameless Postmortem Format  
**Requirement**: Mandatory for all SEV-1 and SEV-2 Incidents within 48 hours of recovery.  

---

## 1. Incident Metadata

- **Incident ID**: `INC-YYYYMMDD-XXX`
- **Severity**: `SEV-1 / SEV-2`
- **Date & Time (IST)**:
- **Incident Commander**:
- **SRE Lead**:
- **Services Affected**:
- **Customer Impact**: (e.g., *14 emergency SOS requests diverted to fallback hotline 108*)

---

## 2. Executive Summary
*High-level summary of what happened, why it happened, and how it was mitigated.*

---

## 3. Detailed Timeline (UTC / IST)
- `HH:MM` — Anomaly detected by automated alert / SRE probe.
- `HH:MM` — Incident commander acknowledges; SEV level declared.
- `HH:MM` — Containment action initiated (feature flag toggled / failover).
- `HH:MM` — Root cause identified in staging reproduction.
- `HH:MM` — Mitigation applied to production.
- `HH:MM` — Recovery verified via regression test suite.

---

## 4. Root Cause Analysis (5 Whys)
1. *Why did the service fail?*
2. *Why did that component fail?*
3. *Why did our monitoring not catch it earlier?*
4. *Why did our staging tests not prevent it?*
5. *Why was our architectural boundary vulnerable?*

---

## 5. Preventative Action Items (Action Matrix)

| Action Item | Type (Mitigate/Prevent/Detect) | Owner | Priority | Target Due Date |
| :--- | :--- | :--- | :---: | :---: |
| | | | P0 / P1 | YYYY-MM-DD |
