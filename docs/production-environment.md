# LifelineX — Production Environment Configuration Specification

---

## 1. Environment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION CLIENT (HTTPS)                    │
│   • VITE_APP_ENV=production                                     │
│   • VITE_SUPABASE_URL=https://prod-api.lifelinex.health         │
│   • VITE_SUPABASE_ANON_KEY=eyJhbGciOi...                        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                   PostgREST & WebSocket (WSS)
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│               SUPABASE PRODUCTION CLOUD (AWS ap-south-1)        │
│   • PostgreSQL 15 (PITR Enabled, Daily Backups, WAL Archiving) │
│   • 18+ RLS Policies Active                                     │
│   • 3 Private Storage Buckets                                   │
│   • 11 Edge Functions with Vault Secrets:                       │
│       - SUPABASE_SERVICE_ROLE_KEY                               │
│       - TWILIO_ACCOUNT_SID & AUTH_TOKEN                         │
│       - EMAIL_PROVIDER_KEY                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Secrets Management & Rotation Policy

1. **Service Role Key**: Stored exclusively in the Supabase Vault. Never imported or exposed to Vite client builds.
2. **Rotation Cycle**: Rotate database credentials and anon JWT keys every 90 days or immediately upon suspected incident.
3. **Audit Monitoring**: All service role invocations log actor ID, action name, and entity ID to `audit_logs`.
