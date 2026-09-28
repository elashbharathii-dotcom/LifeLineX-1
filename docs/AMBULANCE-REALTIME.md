# LifelineX — Ambulance Realtime Telemetry & Reconnection Engine

**Standard**: PostgreSQL Realtime / Scoped WebSocket Replication  

---

## 1. Scoped Subscription Channels

Real-time telemetry events are strictly partitioned by authorization scope:

1. **Patient Channel**: `ambulance:session:{emergencyId}`  
   Receives location and ETA updates only for the single ambulance assigned to their emergency.
2. **Driver Channel**: `ambulance:driver:{driverId}`  
   Receives dispatch notifications, route updates, and status changes for their active shift.
3. **Hospital Channel**: `ambulance:hospital:{hospitalId}`  
   Receives inbound trauma ambulance locations and calculated ETAs.
4. **Fleet Provider Channel**: `ambulance:provider:{providerId}`  
   Receives vehicle telemetry for all units registered under the provider license.

---

## 2. Reconnection & Authoritative State Reconciliation

- **Connection Lost**: UI displays *"Connection lost — attempting reconnection..."*.
- **Re-Established**: Triggers an authoritative backend sync (`GET /ambulance_requests/{id}`) before resuming WebSocket telemetry stream, preventing race conditions or missed status transitions.
