# LifelineX — Disaster Recovery Runbook & Business Continuity Plan

**Classification**: Emergency Operations & SRE Runbook  
**RTO Target**: `< 4 Hours` (Emergency Dispatch Core) | **Status**: `TARGET (Tested in Staging)`  
**RPO Target**: `< 15 Minutes` (WAL Archival) | **Status**: `TARGET (Requires Production Supabase Pro)`  

---

## 1. Outage Scenarios & Step-by-Step Recovery

### Scenario A: PostgreSQL Database Instance Corruption / Crash
1. **Immediate Triage**: Verify health check endpoint `status !== 'healthy'`.
2. **Failover Activation**: Navigate to Supabase Project Dashboard → Database → Backups.
3. **Restore Point Selection**: Choose latest point-in-time recovery timestamp prior to corruption event.
4. **Schema Verification**: Run `supabase db remote commit --dry-run` to confirm integrity of 18+ RLS policies and stored procedure definitions.
5. **Traffic Resumption**: Re-route DNS traffic back to primary cluster.

### Scenario B: Storage Bucket Exfiltration / Key Compromise
1. **Key Invalidation**: Immediately execute key rotation via `supabase secrets set`.
2. **Session Termination**: Invalidate all active user JWT tokens via Supabase Auth Admin API (`signOutAllUsers`).
3. **Bucket Audit**: Query `audit_logs` for any unauthorized `STORAGE_DOWNLOAD` actions within the compromised window.
4. **Bucket Access Re-Seal**: Verify all 3 buckets have `public = FALSE`.

### Scenario C: Telemetry & WebSocket Realtime Partition
1. **Client Fallback**: Database adapter automatically engages exponential backoff reconnects (`1s`, `2s`, `4s`, `8s`).
2. **Preserved UI State**: Client preserves last known confirmed GPS location and displays `Reconnecting…` badge.
3. **No Phantom State**: Client NEVER displays fabricated vehicle movement during realtime disconnects.
