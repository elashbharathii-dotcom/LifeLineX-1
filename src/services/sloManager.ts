/**
 * LifelineX SLO/SLA Definitions & Error Budget Calculator (Phase 12)
 *
 * Defines Service Level Objectives for every critical service path.
 * Tracks error budget consumption and burn rate — aligned with Google SRE practices.
 *
 * References:
 *  - Google SRE Book: https://sre.google/sre-book/service-level-objectives/
 *  - DORA Metrics: Deployment Frequency, Lead Time, MTTR, Change Failure Rate
 */

export interface ServiceLevelObjective {
  /** Unique SLO identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Service / feature path this SLO covers */
  servicePath: string;
  /** Target availability percentage (e.g., 99.9 = three nines) */
  targetAvailabilityPct: number;
  /** Rolling window in days */
  windowDays: number;
  /** Maximum acceptable p95 latency in milliseconds */
  p95LatencyMs: number;
  /** Maximum acceptable p99 latency in milliseconds */
  p99LatencyMs: number;
  /** Alerting burn rate threshold (multiples of baseline error rate) */
  alertBurnRateThreshold: number;
}

export interface ErrorBudget {
  sloId: string;
  windowDays: number;
  totalMinutesInWindow: number;
  /** Allowed downtime minutes = (1 - targetPct/100) * totalMinutes */
  allowedDowntimeMinutes: number;
  /** Observed downtime minutes (from monitoring feed) */
  observedDowntimeMinutes: number;
  /** Remaining budget in minutes */
  remainingBudgetMinutes: number;
  /** Percentage of budget consumed */
  budgetConsumedPct: number;
  /** Status: OK / WARNING (>50% consumed) / CRITICAL (>90% consumed) / EXHAUSTED */
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'EXHAUSTED';
}

/** SLO Registry — covers all critical LifelineX service paths */
export const SLO_REGISTRY: ServiceLevelObjective[] = [
  {
    id: 'SLO-001',
    name: 'Emergency SOS End-to-End Flow',
    servicePath: '/api/emergency/**',
    targetAvailabilityPct: 99.95,
    windowDays: 30,
    p95LatencyMs: 800,
    p99LatencyMs: 2000,
    alertBurnRateThreshold: 14.4, // 1-hour burn rate threshold
  },
  {
    id: 'SLO-002',
    name: 'Blood Request Submission & Matching',
    servicePath: '/api/blood-requests/**',
    targetAvailabilityPct: 99.9,
    windowDays: 30,
    p95LatencyMs: 1200,
    p99LatencyMs: 3000,
    alertBurnRateThreshold: 6,
  },
  {
    id: 'SLO-003',
    name: 'Ambulance Dispatch & Telemetry',
    servicePath: '/api/ambulance/**',
    targetAvailabilityPct: 99.9,
    windowDays: 30,
    p95LatencyMs: 500,
    p99LatencyMs: 1500,
    alertBurnRateThreshold: 6,
  },
  {
    id: 'SLO-004',
    name: 'Authentication & Session Management',
    servicePath: '/api/auth/**',
    targetAvailabilityPct: 99.99,
    windowDays: 30,
    p95LatencyMs: 300,
    p99LatencyMs: 800,
    alertBurnRateThreshold: 14.4,
  },
  {
    id: 'SLO-005',
    name: 'Document Storage Vault (Signed URLs)',
    servicePath: '/api/storage/**',
    targetAvailabilityPct: 99.9,
    windowDays: 30,
    p95LatencyMs: 2000,
    p99LatencyMs: 5000,
    alertBurnRateThreshold: 3,
  },
  {
    id: 'SLO-006',
    name: 'Lifeline AI Copilot Response',
    servicePath: '/api/ai/**',
    targetAvailabilityPct: 99.5,
    windowDays: 30,
    p95LatencyMs: 5000,
    p99LatencyMs: 10000,
    alertBurnRateThreshold: 1,
  },
  {
    id: 'SLO-007',
    name: 'Donor Chain Dispatch Pipeline',
    servicePath: '/api/donor-chain/**',
    targetAvailabilityPct: 99.9,
    windowDays: 30,
    p95LatencyMs: 1500,
    p99LatencyMs: 4000,
    alertBurnRateThreshold: 6,
  },
];

/**
 * Calculates the error budget for a given SLO.
 *
 * @param slo - The SLO definition
 * @param observedDowntimeMinutes - Actual downtime observed from monitoring
 */
export function calculateErrorBudget(
  slo: ServiceLevelObjective,
  observedDowntimeMinutes: number
): ErrorBudget {
  const totalMinutes = slo.windowDays * 24 * 60;
  const allowedDowntime = totalMinutes * (1 - slo.targetAvailabilityPct / 100);
  const remaining = Math.max(0, allowedDowntime - observedDowntimeMinutes);
  const consumed = allowedDowntime > 0
    ? Math.min(100, (observedDowntimeMinutes / allowedDowntime) * 100)
    : 100;

  let status: ErrorBudget['status'] = 'OK';
  if (consumed >= 100) status = 'EXHAUSTED';
  else if (consumed >= 90) status = 'CRITICAL';
  else if (consumed >= 50) status = 'WARNING';

  return {
    sloId: slo.id,
    windowDays: slo.windowDays,
    totalMinutesInWindow: totalMinutes,
    allowedDowntimeMinutes: Math.round(allowedDowntime * 100) / 100,
    observedDowntimeMinutes,
    remainingBudgetMinutes: Math.round(remaining * 100) / 100,
    budgetConsumedPct: Math.round(consumed * 100) / 100,
    status,
  };
}

/**
 * Calculates multi-window burn rate (1h / 6h / 24h) for an SLO.
 * Returns burn rate as a multiple of the baseline error rate.
 *
 * @param slo - The SLO
 * @param recentErrorCountByWindow - Map of window hours to error count
 * @param totalRequestsByWindow - Map of window hours to total request count
 */
export function calculateBurnRate(
  slo: ServiceLevelObjective,
  recentErrorCountByWindow: Record<number, number>,
  totalRequestsByWindow: Record<number, number>
): Record<number, number> {
  const baselineErrorRate = 1 - slo.targetAvailabilityPct / 100;
  const result: Record<number, number> = {};

  for (const hours of [1, 6, 24]) {
    const errors = recentErrorCountByWindow[hours] ?? 0;
    const total = totalRequestsByWindow[hours] ?? 1;
    const observedErrorRate = errors / total;
    result[hours] = baselineErrorRate > 0
      ? Math.round((observedErrorRate / baselineErrorRate) * 100) / 100
      : 0;
  }

  return result;
}

/**
 * Returns a human-readable summary of all SLO statuses.
 */
export function getSloStatusSummary(
  observedDowntimeBySloid: Record<string, number>
): { sloId: string; name: string; status: ErrorBudget['status']; remainingBudgetMinutes: number }[] {
  return SLO_REGISTRY.map((slo) => {
    const budget = calculateErrorBudget(slo, observedDowntimeBySloid[slo.id] ?? 0);
    return {
      sloId: slo.id,
      name: slo.name,
      status: budget.status,
      remainingBudgetMinutes: budget.remainingBudgetMinutes,
    };
  });
}
