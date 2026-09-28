# LifelineX — Resource Discovery Privacy & Data Minimization

**Standard**: India DPDP Act 2023 / Privacy by Design in Healthcare Geolocation  

---

## 1. Geospatial Obfuscation (Donor Shield)

To prevent personal tracking or home stalking of voluntary blood donors:
1. **~800m Jitter Algorithm**: Donor coordinates returned to authorized search queries are mathematically offset:
   ```typescript
   export function getBlurredLocation(lat: number, lon: number): [number, number] {
     return [Math.round((lat + 0.007) * 1000) / 1000, Math.round((lon - 0.005) * 1000) / 1000];
   }
   ```
2. **Obfuscated Labels**: Search results display `Potential Donor Candidate #N` instead of legal names.
3. **No Direct Contact Details**: Phone numbers and emails are hidden from discovery results; communication is mediated exclusively via automated notification queues.

---

## 2. Role-Based Discovery Scope Matrix

| Role | Hospitals Discovery | Blood Banks Discovery | Ambulance Discovery | Donor Candidates Discovery |
| :--- | :---: | :---: | :---: | :---: |
| **PATIENT** | ✅ Full | ✅ Full | ✅ Assigned Only | ❌ **DENIED** |
| **DONOR** | ✅ Full | ✅ Full | ❌ **DENIED** | ❌ **DENIED** |
| **HOSPITAL_STAFF** | ✅ Full | ✅ Full | ✅ Available Fleet | ✅ **ALLOWED** (Obfuscated) |
| **BLOOD_BANK_STAFF**| ✅ Full | ✅ Full | ❌ **DENIED** | ✅ **ALLOWED** (Obfuscated) |
| **AMBULANCE_DRIVER** | ✅ Destination | ❌ **DENIED** | ✅ Self Vehicle | ❌ **DENIED** |
| **LIFELINEX_ADMIN** | ✅ Full | ✅ Full | ✅ Full Fleet | ✅ **ALLOWED** (Obfuscated) |
