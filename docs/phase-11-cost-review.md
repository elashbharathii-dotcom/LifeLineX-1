# LifelineX — Phase 11 Production Cost Review & Resource Quotas

**Standard**: FinOps / Cloud Cost Optimization Guidelines  

---

## 1. Projected Monthly Infrastructure Cost Model (Pilot vs Production)

| Service / Resource | Pilot Allocation | Production Scale | Optimization Strategy |
| :--- | :--- | :--- | :--- |
| **Supabase Cloud Pro** | $25 / month | $25 + Compute Add-ons | Efficient indexing on `emergency_sessions` |
| **Map Tiles (OSM / Mapbox)** | Free Tier (OSM CDN) | $50 / month | Viewport clustering & browser caching |
| **SMS Gateway (Twilio)** | $0 (In-app only) | $0.0075 / SMS | In-app push first; SMS reserved for critical alerts |
| **Edge Functions / Vercel**| Free Tier | $20 / month | Optimized function bundles `< 50 KB` |
| **Total Monthly Cost** | **~$25 / month** | **~$100–$250 / month** | High-efficiency serverless architecture |
