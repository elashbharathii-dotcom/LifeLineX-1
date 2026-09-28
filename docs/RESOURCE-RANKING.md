# LifelineX — Resource Discovery Ranking Algorithms

**Core Principle**: *Ranking is strictly an operational efficiency heuristic. It is NEVER presented as an automated medical judgment or clinical triage decision.*  

---

## 1. Hospital Ranking Algorithm

Hospitals are ranked using a multi-factor operational score:

$$\text{Score}_{\text{hosp}} = w_{\text{ver}} \cdot S_{\text{ver}} + w_{\text{dist}} \cdot \left(1 - \frac{D}{D_{\max}}\right) + w_{\text{icu}} \cdot S_{\text{icu}}$$

- **Verification Status ($S_{\text{ver}}$)**: `1.0` if Government/KYC Verified; `0.0` otherwise (Verified always sorted first).
- **Proximity ($D$)**: Normalized Haversine distance from origin coordinates.
- **ICU/Trauma Readiness ($S_{\text{icu}}$)**: Weighted positive bonus if active ICU ventilators are reported available.

---

## 2. Ambulance Dispatch Candidate Ranking

Ambulances are evaluated according to operational dispatch availability:

1. **Availability Status**: `AVAILABLE` vehicles are prioritized over `OCCUPIED` / `DISPATCHED` units.
2. **Proximity & Response Vector**: Shortest physical road distance via Haversine projection.
3. **Vehicle Capability**: Advanced Life Support (ALS) with ventilator units prioritized for critical trauma SOS requests.
4. **GPS Freshness**: Telemetry updated within ≤ 30 seconds prioritized over stale connections.

---

## 3. Potential Donor Matching Ranking

Donors are matched based on:
1. **Clinical ABO/Rh Compatibility**: Universal donors ($O-$) and exact group matches prioritized.
2. **Geographic Proximity**: Approximate distance ($D_{\text{approx}}$) computed using blurred coordinates (~800m offset).
3. **Past Participation & Reliability**: Donors with verified past successful donations and active availability.
