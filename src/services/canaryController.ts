/**
 * LifelineX Canary Rollout Controller (Phase 12)
 *
 * Implements blue-green / canary traffic splitting for controlled progressive delivery.
 *
 * Strategy:
 *  - "Blue" = current stable production version
 *  - "Green" = new candidate version
 *  - Users are deterministically bucketed into blue/green by userId hash
 *  - Canary percentage can be dialled from 0% → 100% without redeployment
 *  - Automatic rollback triggers if error rate exceeds configured threshold
 *
 * This module does NOT handle the actual serving infrastructure (CDN/load balancer),
 * but produces the routing decision that infrastructure reads.
 */

export type CanarySlot = 'blue' | 'green';

export interface CanaryConfig {
  /** Identifier for this canary session */
  sessionId: string;
  /** Version tag for the "blue" (stable) deployment */
  blueVersion: string;
  /** Version tag for the "green" (canary) deployment */
  greenVersion: string;
  /** Percentage of traffic routed to green (0–100) */
  greenTrafficPct: number;
  /** Whether the canary is currently active */
  active: boolean;
  /** Automatic rollback threshold: if green error rate > this %, roll back */
  rollbackErrorRatePct: number;
  /** ISO timestamp of canary start */
  startedAt: string;
  /** Actor who started the canary */
  startedBy: string;
}

export interface CanaryMetrics {
  sessionId: string;
  blueRequests: number;
  blueErrors: number;
  blueErrorRatePct: number;
  greenRequests: number;
  greenErrors: number;
  greenErrorRatePct: number;
  rollbackTriggered: boolean;
  rollbackReason?: string;
}

/** Active canary session (null = not in canary, all traffic on blue) */
let activeCanary: CanaryConfig | null = null;

/** In-session metrics counters */
let canaryMetrics: CanaryMetrics = _emptyMetrics('');

/**
 * Starts a new canary session.
 */
export function startCanary(config: Omit<CanaryConfig, 'startedAt'>): {
  success: boolean;
  error?: string;
} {
  if (activeCanary?.active) {
    return { success: false, error: 'A canary session is already active. Stop it before starting a new one.' };
  }
  if (config.greenTrafficPct < 0 || config.greenTrafficPct > 100) {
    return { success: false, error: 'greenTrafficPct must be between 0 and 100.' };
  }

  activeCanary = { ...config, startedAt: new Date().toISOString() };
  canaryMetrics = _emptyMetrics(config.sessionId);
  return { success: true };
}

/**
 * Stops the active canary session and promotes green to blue, or rolls back.
 */
export function stopCanary(promote: boolean): { finalVersion: string; reason: string } {
  if (!activeCanary) {
    return { finalVersion: 'blue', reason: 'No active canary session.' };
  }

  const result = promote
    ? { finalVersion: activeCanary.greenVersion, reason: 'Canary promoted: green is now stable.' }
    : { finalVersion: activeCanary.blueVersion, reason: 'Canary rolled back: blue remains stable.' };

  activeCanary = null;
  return result;
}

/**
 * Returns the routing slot (blue/green) for a given user.
 * If no canary is active, always returns 'blue'.
 *
 * @param userId - The user identifier for deterministic bucketing
 */
export function resolveUserSlot(userId: string): CanarySlot {
  if (!activeCanary || !activeCanary.active) return 'blue';

  // Check if rollback was triggered
  if (_isRollbackTriggered()) {
    return 'blue';
  }

  const bucket = _stableHash(userId + activeCanary.sessionId) % 100;
  return bucket < activeCanary.greenTrafficPct ? 'green' : 'blue';
}

/**
 * Records a request outcome for metrics tracking.
 *
 * @param slot - Which slot (blue/green) served the request
 * @param isError - Whether the request resulted in an error
 */
export function recordRequest(slot: CanarySlot, isError: boolean): void {
  if (slot === 'blue') {
    canaryMetrics.blueRequests++;
    if (isError) canaryMetrics.blueErrors++;
    canaryMetrics.blueErrorRatePct =
      canaryMetrics.blueRequests > 0
        ? Math.round((canaryMetrics.blueErrors / canaryMetrics.blueRequests) * 10000) / 100
        : 0;
  } else {
    canaryMetrics.greenRequests++;
    if (isError) canaryMetrics.greenErrors++;
    canaryMetrics.greenErrorRatePct =
      canaryMetrics.greenRequests > 0
        ? Math.round((canaryMetrics.greenErrors / canaryMetrics.greenRequests) * 10000) / 100
        : 0;
  }

  // Check and set rollback flag if threshold exceeded
  if (_isRollbackTriggered() && !canaryMetrics.rollbackTriggered) {
    canaryMetrics.rollbackTriggered = true;
    canaryMetrics.rollbackReason = `Green error rate ${canaryMetrics.greenErrorRatePct}% exceeded threshold ${activeCanary?.rollbackErrorRatePct ?? 0}%`;
  }
}

/** Returns a snapshot of current canary metrics */
export function getCanaryMetrics(): CanaryMetrics {
  return { ...canaryMetrics };
}

/** Returns the active canary config, or null if no canary is running */
export function getActiveCanary(): CanaryConfig | null {
  return activeCanary ? { ...activeCanary } : null;
}

function _isRollbackTriggered(): boolean {
  if (!activeCanary) return false;
  return (
    canaryMetrics.greenRequests >= 100 && // Only trigger after statistical minimum
    canaryMetrics.greenErrorRatePct > activeCanary.rollbackErrorRatePct
  );
}

function _emptyMetrics(sessionId: string): CanaryMetrics {
  return {
    sessionId,
    blueRequests: 0,
    blueErrors: 0,
    blueErrorRatePct: 0,
    greenRequests: 0,
    greenErrors: 0,
    greenErrorRatePct: 0,
    rollbackTriggered: false,
  };
}

function _stableHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) + hash + input.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
