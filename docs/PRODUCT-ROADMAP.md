# LifelineX — Product Roadmap & Priority Hierarchy

**Guiding Principle**: *Never prioritize cosmetic enhancements above emergency reliability, patient safety, or data security.*  

---

## P0 — Critical (Core Safety, Security & Operational Reliability)

- [ ] **Production Cloud Database Provisioning**: Provision production-tier Supabase project and execute `supabase db push`.
- [ ] **SMS Gateway Activation**: Inject live Twilio / MSG91 credentials into production secret vault.
- [ ] **Institutional Hospital DPAs**: Physical execution of Data Processing Agreements with participating pilot trauma centers in Chennai.
- [ ] **NBTC Blood Bank Authorization**: Statutory government blood-bank inspection completion.
- [ ] **India DPDP Act 2023 Filing**: Formal Data Fiduciary registration filing.
- [ ] **Continuous Telemetry Sanitization**: Automated AST scanner in CI to reject any commit containing sensitive credentials.

---

## P1 — High Priority (Clinical Workflow Optimization & SRE)

- [ ] **Automated Donor Chain SMS Escalation**: Trigger live SMS alerts upon Tier 2 backup pool activation.
- [ ] **Hospital ER Bed Occupancy Sensor Integration**: Real-time IoT sensor telemetry feed for live ICU/ER bed availability.
- [ ] **Ambulance Hardware OBU Integration**: Hardware On-Board Unit (OBU) GPS integration for dedicated emergency fleet vehicles.
- [ ] **Cold-Chain Blood Temperature Telemetry**: Real-time IoT temperature logging for blood in transit.
- [ ] **Multi-Cluster Pilot Expansion**: Geographic expansion beyond Chennai Metro Cluster into tier-2 regional healthcare networks.

---

## P2 — Important (Analytics & Administrative Usability)

- [ ] **Executive Healthcare Analytics Dashboard**: Real-time trauma survival metrics and response-time distribution curves.
- [ ] **Regional Blood Bank Deficit Predictor**: Time-series statistical forecast of seasonal rare-blood requirements.
- [ ] **Doctor Multi-Facility Rota Management**: Cross-hospital specialist doctor scheduling.
- [ ] **Regional Language Voice Prompting**: Tamil, Hindi, Telugu, and Kannada voice-guided emergency SOS prompts.

---

## P3 — Enhancement (Visual Refinement & Convenience)

- [ ] **Dark / Light Theme Auto-Switching by Ambient Light Sensor**: Dynamic OS theme sync.
- [ ] **Haptic Feedback Patterns**: Specialized vibration rhythms for ambulance driver turn-by-turn prompts.
- [ ] **Offline PWA Map Tile Pre-Caching**: Automated local caching of active 5km emergency radius tile layers.
