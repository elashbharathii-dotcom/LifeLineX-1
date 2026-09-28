# LifelineX — Phase 11 Production Rollback Strategy

---

## 1. Multi-Tier Rollback Plan

- **Application Frontend**: Instant deployment rollback via Vercel / Cloudflare Pages dashboard (`0 seconds downtime`).
- **Feature Flags**: Set `isPilotActive: false` or disable specific module flags in `src/services/pilotConfig.ts`.
- **Edge Functions**: Redeploy previous Git commit hash via `supabase functions deploy <fn>`.
- **Database Migrations**: Apply sequential reverse down-migrations (Never execute `db reset` on production).
