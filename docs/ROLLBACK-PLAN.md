# LifelineX — Production Rollback & Emergency Degradation Plan

**Target Recovery Time (MTTR)**: `< 15 Minutes (P0)`  

---

## 1. Rollback Dimensions & Procedures

### 1.1 Application Bundle Rollback (Frontend / CDN)
- **Mechanism**: Instant CDN pointer reversal to previous immutable build commit hash (`git rev-parse HEAD~1`).
- **Execution Time**: `< 2 Minutes`.
- **Trigger**: JavaScript runtime crash rate > 1% or white screen on mobile browsers.

### 1.2 Database Migration Rollback (PostgreSQL)
- **Principle**: *Always Forward-Compatible*. Never run destructive column drops in production without a two-step deprecation cycle.
- **Rollback SQL**: Every migration file in `supabase/migrations/` must have a corresponding reverse script in `supabase/rollbacks/`.
- **Procedure**:
  ```bash
  # In staging / production rollback:
  supabase db reset --linked --version <TARGET_MIGRATION_VERSION>
  ```

### 1.3 Feature Flag Reversal (Zero-Downtime)
- **Mechanism**: Call `featureFlagManager.setFlag(flagKey, false, 'sre-lead', reason)` to instantly deactivate failing features (e.g., AI assistant or donor-chain auto-escalation) without redeploying code.

### 1.4 External Provider Fallback
- **SMS Gateway**: Toggle `sms_notifications = false` to fallback to in-app notifications and web audio alerts.
- **Map CDN**: Switch `VITE_MAP_TILE_SERVER` to fallback OpenStreetMap mirror.
