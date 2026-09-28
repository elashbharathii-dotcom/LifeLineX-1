# LifelineX — Production Incident Response & Emergency Failure Runbook

**Standard**: NIST SP 800-61 Rev. 2 / SRE Incident Command System  
**Owner**: SRE On-Call Lead & Clinical Safety Director  

---

## 1. Incident Severity Definitions

| Level | Definition | Response SLA | Command Hierarchy | Communication Target |
| :--- | :--- | :---: | :--- | :--- |
| **SEV-1 (Critical)** | Core emergency dispatch failure, total DB outage, data breach | **< 5 min** | SRE Lead + Chief Medical Officer | Emergency SMS / Hotline broadcast |
| **SEV-2 (Major)** | Single hospital triage down, blood inventory mutex blocked | **< 15 min** | SRE On-Call + Healthcare Liaison | Ops Slack `#incidents-sev2` |
| **SEV-3 (Moderate)**| SMS delay, non-critical map tile lag, AI timeout | **< 60 min** | Senior Full-Stack Engineer | Dashboard Alert Banner |
| **SEV-4 (Minor)** | Minor UI styling glitch, non-critical report export delay | **< 4 hours** | Frontend Lead | Jira Service Desk Ticket |

---

## 2. Emergency Failure Scenarios (Scenarios A through J)

| Scenario | Trigger / Detection | Truthful User Display | Immediate Mitigation / Fallback Action | Recovery Verification |
| :--- | :--- | :--- | :--- | :--- |
| **A. Emergency Creation Unavailable** | API timeout on `/api/emergency` | *"Service temporarily unavailable. Please call 108 directly."* | Fallback hotline button (`tel:108`) displayed in prominent red card. | Test mock SOS payload to staging endpoint. |
| **B. GPS Location Unavailable** | Browser Geolocation error (denied/timeout) | *"Location unavailable. Please select facility or input landmark."* | Prompt manual hospital selector; append `LOCATION_UNAVAILABLE` flag. | Confirm manual coordinate resolution in DB. |
| **C. Ambulance Dispatch Unavailable** | Zero available fleet units in geofence | *"No ambulances available in your radius. Alerting nearest hospital."* | Trigger direct hospital ER trauma alert; instruct bystander transport. | Check dispatch queue status in command center. |
| **D. Ambulance GPS Stale / Dropped** | Telemetry timestamp delta > 30s | *"Live location update paused. Last seen: 2 mins ago."* | Display last verified location with warning banner; do not simulate fake movement. | Resume real-time ping once driver reconnects. |
| **E. Hospital Coordination Unavailable** | Hospital network disconnection | *"Hospital triage channel offline. Connecting to backup trauma center."* | Failover to next nearest verified hospital in cluster. | Ping hospital node health endpoint. |
| **F. Blood Request Unavailable** | Inventory mutex timeout / DB lock | *"Processing blood search via regional backup network."* | Escalate directly to Tier 2 donor chain phone hotline. | Verify inventory transaction rollback in PostgreSQL. |
| **G. Notification Provider Down** | SMS Gateway 500 error / zero credits | *"In-app emergency notifications active."* | Trigger in-app notification drawer + high-priority audio alert chimes. | Check Twilio / MSG91 API status page. |
| **H. Database Unavailable** | Connection pool exhausted / 503 | *"Maintenance mode. Emergency services: Call 108 / 112."* | Display static fallback page; initiate PITR database failover. | Confirm `SELECT 1` health query returns 200. |
| **I. Authentication Unavailable** | Auth service JWT verification failure | *"Session expired. Emergency SOS available without login."* | Allow guest emergency SOS trigger with phone-number verification. | Validate auth server endpoint response. |
| **J. Realtime WebSocket Dropped** | Socket close event (code 1006) | *"Live sync reconnecting..."* | Automatic reconnect with exponential backoff (1s, 2s, 4s, 8s); poll fallback. | Confirm WebSocket handshake status. |
