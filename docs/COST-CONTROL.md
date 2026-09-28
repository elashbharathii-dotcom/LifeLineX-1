# LifelineX — Cost Control & Operational Quota Governance

**Standard**: Cloud Resource Optimization & Waste Prevention  

---

## 1. Primary Operational Cost Drivers & Guardrails

| Cost Driver | Potential Risk | Architectural Guardrail | Configured Quota / Limit |
| :--- | :--- | :--- | :--- |
| **Map Tiles (OSM / Mapbox)** | Excessive panning/zooming request storm | Client-side tile caching & debounced viewport updates | Max 10 requests / sec / client |
| **Ambulance Live GPS** | Continuous sub-second updates draining cell data | 5-second throttled telemetry streaming (`locationService.ts`) | 12 pings / minute / active ambulance |
| **SMS / OTP Deliveries** | Verification bot abuse / notification storms | Rate limited to 3 OTP attempts per phone number per 15 mins | 3 OTPs / 15 mins |
| **AI Copilot Tokens** | Infinite prompt loops / token dumping | Max 500 response tokens; 5 requests / min per user rate limit | 5 prompts / min |
| **Database Realtime Channels** | Unbounded subscriptions on large tables | Strict PostGIS bounding box filters on all WebSocket channels | Scoped to active cluster only |
| **Document Storage Vault** | Large uncompressed file upload abuse | Max file size 5MB; image compression before upload | 5MB per document |
