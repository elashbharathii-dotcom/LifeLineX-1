# LifelineX — Operations & Support Runbook

**Audience**: Level 1 (Helpdesk) · Level 2 (Hospital/Fleet Ops) · Level 3 (SRE / Engineering)  

---

## 1. Common Operational Issues & Tiered Resolution

### 1.1 "Location Unavailable" during Emergency SOS
- **Cause**: User rejected browser location prompt or GPS hardware disabled.
- **L1 Resolution**: Instruct user to tap manual hospital selector dropdown or dial `108 / 112`.
- **L2 Escalation**: If widespread across multiple users, check for SSL/HTTPS certificate issues (Geolocation requires secure context).

### 1.2 Ambulance Driver Cannot See Assigned Emergency
- **Cause**: Driver status marked `OFF_DUTY` or assigned to conflicting trip.
- **L1 Resolution**: Instruct driver to toggle status stepper to `AVAILABLE` in driver cockpit.
- **L2 Escalation**: Dispatch operator manually re-assigns vehicle in Ambulance Command Center.

### 1.3 Blood Inventory Allocation Conflict
- **Cause**: Two hospitals requested the same rare blood unit concurrently.
- **L1 Resolution**: System atomic mutex assigned unit to first timestamp; instruct second hospital to initiate donor chain request.
- **L2 Escalation**: Contact regional blood bank manager to verify physical cold-storage stock.

### 1.4 Verification Document Upload Failed
- **Cause**: File size exceeded 5MB or invalid MIME type.
- **L1 Resolution**: Instruct facility admin to upload PDF or JPEG under 5MB.
- **L3 Escalation**: Check Supabase Storage bucket policy permissions.
