# LifelineX — Network Intelligence & Resource Discovery 2.0 Architectural Specification

**Module**: Resource Discovery Hub (`src/components/discovery/ResourceDiscoveryHub.tsx`)  
**Backend Service**: `src/services/resourceDiscoveryService.ts`  
**Standard**: Real-Time Healthcare Geospatial Query & Availability Telemetry  

---

## 1. System Architecture

```
User Query (Role, Origin Coordinates, Radius, Filters)
                   │
                   ▼
   [Resource Discovery Service 2.0]
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
[Role-Based Authorization]   [Geospatial Haversine Index]
    │                             │
    ▼                             ▼
[Database Filtering] ────────► [Availability Freshness Check]
    │                             │
    ▼                             ▼
[Privacy Jitter (~800m)] ────► [Resource Ranking & Sorting]
                                  │
                                  ▼
                     [Structured Result Payload]
```

---

## 2. Resource Query Domains & Fields

| Resource Type | Available Filters | Key Returned Data | Role Access |
| :--- | :--- | :--- | :--- |
| **Hospitals** | Radius (5–50km), Verified Only, ER Ward, Blood Bank, Search Query | Name, Address, Verified KYC, ER Beds, ICU Beds, Distance Km, Emergency Phone | ALL ROLES |
| **Blood Banks** | Radius (5–50km), Blood Group, Component, Min Units, Verified Only | Name, License Number, Matched Units Available, Last Confirmed Timestamp | ALL ROLES |
| **Ambulances** | Radius (5–30km), Vehicle Type (ALS/BLS), Availability Status | Vehicle Number, Provider, Live Speed, GPS Freshness (≤30s), ETA Minutes | ALL ROLES |
| **Donor Matches**| Radius (5–25km), Recipient Blood Group, Verified Only | Obfuscated Label (`Donor Candidate #N`), Approx Distance, ~800m Jitter Coordinates | MEDICAL STAFF ONLY |

---

## 3. Truthful Availability & Zero-Data Fallbacks

1. **Unintegrated Bed Capacities**: Displays *"Capacity reporting unavailable"* rather than fabricating numbers.
2. **Stale Telemetry**: If GPS update is >30s old, flags *"Stale (>30s)"* and disables live ETA claims.
3. **No Resources Found**: Clear contextual empty state with guidance to expand radius (e.g., *"No verified blood banks with O- stock found in 10 km radius"*).
