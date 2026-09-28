# LifelineX — India Healthcare & Regulatory Compliance Checklist

## 1. Digital Personal Data Protection (DPDP) Act 2023 & DISHA
- [x] **Explicit User Consent**: Consents are recorded with timestamp and version in `consents` table.
- [x] **Purpose Limitation**: Personal donor GPS coordinates are never exposed publicly.
- [x] **Right to Correction & Erasure**: Profiles can be updated or deactivated by users.
- [x] **Aadhaar/National ID Protection**: Raw national identity numbers are strictly masked/hashed; no raw storage.

## 2. National Blood Transfusion Council (NBTC) & Drugs and Cosmetics Act
- [x] All blood bank licenses are verified before enabling unit dispatch.
- [x] Medical eligibility declarations are mandated prior to donor matching.
- [x] Minimum donation intervals and cold-chain temperature (4.0°C) are logged in `blood_inventory`.

## 3. Emergency Healthcare Dispatch Standards
- [x] Telemetry streaming is opt-in with driver confirmation.
- [x] Nearest trauma center routing utilizes real-time distance metrics.
- [x] AI assistance explicitly carries non-prescriptive disclaimers and requires clinical triage sign-off.
