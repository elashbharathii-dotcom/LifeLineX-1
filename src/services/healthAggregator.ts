/**
 * LifelineX Platform Health Aggregator (Phase 12)
 *
 * Produces a structured, machine-readable platform health snapshot.
 * This is the data model consumed by:
 *   - Admin Status Dashboard (/admin/health)
 *   - External monitoring probes (Uptime Robot / BetterUptime)
 *   - Incident runbooks
 *   - SRE on-call rotation alerts
 *
 * Each subsystem reports its own health status.
 * The aggregate status is the worst individual component status.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

export interface SubsystemHealth {
  name: string;
  status: HealthStatus;
  /** Latency of the last health probe in milliseconds */
  latencyMs: number | null;
  /** Human-readable message about current state */
  message: string;
  /** ISO timestamp of the last successful check */
  lastCheckedAt: string;
  /** Whether this subsystem is a hard dependency (outage = full platform down) */
  isHardDependency: boolean;
}

export interface PlatformHealthSnapshot {
  /** Aggregate platform status */
  overallStatus: HealthStatus;
  /** ISO timestamp of this snapshot */
  snapshotAt: string;
  /** Platform version tag */
  version: string;
  /** Individual subsystem statuses */
  subsystems: SubsystemHealth[];
  /** Active incident count */
  activeIncidents: number;
  /** Whether the platform is currently in controlled pilot mode */
  isPilotMode: boolean;
  /** Active pilot cluster name */
  pilotCluster: string | null;
}

/**
 * Aggregates subsystem health statuses into a platform-level snapshot.
 *
 * Rules:
 *  - If any HARD DEPENDENCY is 'critical' → overall = 'critical'
 *  - If any subsystem (hard or soft) is 'critical' → overall = at least 'degraded'
 *  - If any subsystem is 'degraded' → overall = 'degraded' (unless already critical)
 *  - Otherwise → 'healthy'
 */
export function aggregatePlatformHealth(
  subsystems: SubsystemHealth[],
  activeIncidents: number,
  isPilotMode: boolean,
  pilotCluster: string | null,
  version: string
): PlatformHealthSnapshot {
  let overallStatus: HealthStatus = 'healthy';

  for (const sub of subsystems) {
    if (sub.isHardDependency && sub.status === 'critical') {
      overallStatus = 'critical';
      break;
    }
    if (sub.status === 'critical' || sub.status === 'degraded') {
      overallStatus = 'degraded';
    }
  }

  // Active unresolved P1 incidents also force at least degraded
  if (activeIncidents > 0 && overallStatus === 'healthy') {
    overallStatus = 'degraded';
  }

  return {
    overallStatus,
    snapshotAt: new Date().toISOString(),
    version,
    subsystems,
    activeIncidents,
    isPilotMode,
    pilotCluster,
  };
}

/**
 * Returns a deterministic mock health snapshot for the current environment.
 * In production, each subsystem probe would be replaced by a real async check.
 */
export function getMockHealthSnapshot(version: string = '1.0.0-rc.1'): PlatformHealthSnapshot {
  const now = new Date().toISOString();

  const subsystems: SubsystemHealth[] = [
    {
      name: 'Supabase PostgreSQL',
      status: 'healthy',
      latencyMs: 4,
      message: 'Primary database responding within SLO',
      lastCheckedAt: now,
      isHardDependency: true,
    },
    {
      name: 'Supabase Auth',
      status: 'healthy',
      latencyMs: 6,
      message: 'JWT issuance and validation operational',
      lastCheckedAt: now,
      isHardDependency: true,
    },
    {
      name: 'Supabase Storage',
      status: 'healthy',
      latencyMs: 38,
      message: 'Signed URL generation within SLO (< 200ms)',
      lastCheckedAt: now,
      isHardDependency: false,
    },
    {
      name: 'Supabase Realtime',
      status: 'healthy',
      latencyMs: 12,
      message: 'WebSocket connections established; ambulance telemetry streaming',
      lastCheckedAt: now,
      isHardDependency: false,
    },
    {
      name: 'SMS / OTP Gateway',
      status: 'degraded',
      latencyMs: null,
      message: 'BLOCKED: Live credentials not injected. In-app notifications active as fallback.',
      lastCheckedAt: now,
      isHardDependency: false,
    },
    {
      name: 'OpenStreetMap CDN',
      status: 'healthy',
      latencyMs: 87,
      message: 'Map tile delivery within SLO (< 200ms avg)',
      lastCheckedAt: now,
      isHardDependency: false,
    },
    {
      name: 'Lifeline AI Edge Function',
      status: 'healthy',
      latencyMs: 1240,
      message: 'Medical guardrails active; non-clinical coordination only',
      lastCheckedAt: now,
      isHardDependency: false,
    },
    {
      name: 'PostGIS Geospatial Layer',
      status: 'healthy',
      latencyMs: 3,
      message: 'Pilot geofence bounding box operational; spatial queries within SLO',
      lastCheckedAt: now,
      isHardDependency: false,
    },
    {
      name: 'Frontend CDN (Vite Bundle)',
      status: 'healthy',
      latencyMs: 18,
      message: 'Production bundle served (512 kB / 147 kB gzip)',
      lastCheckedAt: now,
      isHardDependency: true,
    },
  ];

  return aggregatePlatformHealth(subsystems, 0, true, 'Chennai Metro Healthcare Pilot', version);
}
