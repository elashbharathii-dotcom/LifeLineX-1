# LifelineX — Geospatial Query & Indexing Architecture

**Standard**: Geospatial Indexing & Low-Latency Query Optimization  

---

## 1. Haversine Distance Engine

Distances across all resource searches are calculated using great-circle trigonometry:

```typescript
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};
```

---

## 2. Configurable Search Radii

| Radius Setting | Operational Purpose | Typical Latency | Default Clustered Units |
| :---: | :--- | :---: | :---: |
| **5 km** | Immediate neighborhood / rapid first responder | `< 5ms` | 2–5 Hospitals / Ambulances |
| **10 km** | Local municipal cluster | `< 8ms` | 5–12 Facilities |
| **20 km** | Greater metropolitan network | `< 12ms` | 15–30 Facilities |
| **50 km** | Regional trauma & rare blood search | `< 20ms` | 50+ Facilities |
