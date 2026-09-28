/**
 * LifelineX Feature Flag Runtime Manager (Phase 12)
 *
 * Provides runtime-switchable feature flags with:
 *  - Graduated rollout (percentage-based)
 *  - Role-gated access
 *  - Environment-aware defaults
 *  - Change audit trail (immutable log)
 *
 * Flags can be toggled without a redeployment via the Admin console.
 * All flag changes are appended to an in-memory audit trail for this session.
 */

export type FlagEnvironment = 'development' | 'staging' | 'production';

export type FlagRolloutStrategy =
  | 'ALL_USERS'
  | 'PERCENTAGE'
  | 'ROLE_GATED'
  | 'DISABLED';

export interface FeatureFlag {
  /** Unique flag identifier */
  key: string;
  /** Human-readable description */
  description: string;
  /** Whether this flag is globally enabled */
  enabled: boolean;
  /** Rollout strategy */
  strategy: FlagRolloutStrategy;
  /** Percentage of users to receive this flag (0–100). Used when strategy = 'PERCENTAGE' */
  rolloutPercentage: number;
  /** Roles that can access this flag. Used when strategy = 'ROLE_GATED' */
  allowedRoles: string[];
  /** Environments in which this flag is active */
  environments: FlagEnvironment[];
  /** ISO timestamp of last modification */
  lastModifiedAt: string;
  /** Author of last modification */
  lastModifiedBy: string;
}

export interface FlagAuditEntry {
  flagKey: string;
  previousValue: boolean;
  newValue: boolean;
  changedBy: string;
  changedAt: string;
  reason: string;
}

/** The canonical production flag registry */
const FLAG_REGISTRY: Map<string, FeatureFlag> = new Map([
  [
    'emergency_sos',
    {
      key: 'emergency_sos',
      description: 'Core Emergency SOS dispatch flow',
      enabled: true,
      strategy: 'ALL_USERS',
      rolloutPercentage: 100,
      allowedRoles: [],
      environments: ['development', 'staging', 'production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
  [
    'blood_request',
    {
      key: 'blood_request',
      description: 'Blood request creation and matching',
      enabled: true,
      strategy: 'ALL_USERS',
      rolloutPercentage: 100,
      allowedRoles: [],
      environments: ['development', 'staging', 'production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
  [
    'donor_chain',
    {
      key: 'donor_chain',
      description: 'Multi-tier automated donor chain dispatch',
      enabled: true,
      strategy: 'ALL_USERS',
      rolloutPercentage: 100,
      allowedRoles: [],
      environments: ['development', 'staging', 'production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
  [
    'sms_notifications',
    {
      key: 'sms_notifications',
      description: 'Live SMS/OTP delivery via external gateway',
      enabled: false, // BLOCKED until live credentials injected
      strategy: 'DISABLED',
      rolloutPercentage: 0,
      allowedRoles: [],
      environments: ['production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
  [
    'ai_assistant',
    {
      key: 'ai_assistant',
      description: 'Lifeline AI coordination copilot (non-clinical)',
      enabled: true,
      strategy: 'ALL_USERS',
      rolloutPercentage: 100,
      allowedRoles: [],
      environments: ['development', 'staging', 'production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
  [
    'advanced_analytics_dashboard',
    {
      key: 'advanced_analytics_dashboard',
      description: 'Extended admin analytics — canary rollout',
      enabled: true,
      strategy: 'PERCENTAGE',
      rolloutPercentage: 10, // 10% canary
      allowedRoles: ['system_admin', 'hospital_admin'],
      environments: ['staging', 'production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
  [
    'multi_cluster_expansion',
    {
      key: 'multi_cluster_expansion',
      description: 'Expand beyond Chennai pilot geo-fence to secondary clusters',
      enabled: false, // Requires regulatory approval for each new cluster
      strategy: 'ROLE_GATED',
      rolloutPercentage: 0,
      allowedRoles: ['system_admin'],
      environments: ['production'],
      lastModifiedAt: '2026-09-02T00:00:00Z',
      lastModifiedBy: 'system',
    },
  ],
]);

/** Immutable in-session audit trail for flag changes */
const FLAG_AUDIT_TRAIL: FlagAuditEntry[] = [];

/**
 * Evaluates whether a flag is active for a given user.
 *
 * @param flagKey - The flag identifier
 * @param userRole - The role of the requesting user
 * @param userId - The user ID (used for percentage-based bucketing)
 * @param env - The current environment
 */
export function isFlagActive(
  flagKey: string,
  userRole: string = 'anonymous',
  userId: string = '',
  env: FlagEnvironment = 'production'
): boolean {
  const flag = FLAG_REGISTRY.get(flagKey);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (!flag.environments.includes(env)) return false;

  switch (flag.strategy) {
    case 'DISABLED':
      return false;

    case 'ALL_USERS':
      return true;

    case 'ROLE_GATED':
      return flag.allowedRoles.includes(userRole);

    case 'PERCENTAGE': {
      // Deterministic bucket using userId hash — same user always gets same result
      const bucket = stableHash(userId + flagKey) % 100;
      return bucket < flag.rolloutPercentage;
    }

    default:
      return false;
  }
}

/**
 * Toggles a feature flag. Records the change in the immutable audit trail.
 */
export function setFlag(
  flagKey: string,
  enabled: boolean,
  changedBy: string,
  reason: string
): { success: boolean; error?: string } {
  const flag = FLAG_REGISTRY.get(flagKey);
  if (!flag) {
    return { success: false, error: `Flag '${flagKey}' not found in registry.` };
  }

  FLAG_AUDIT_TRAIL.push({
    flagKey,
    previousValue: flag.enabled,
    newValue: enabled,
    changedBy,
    changedAt: new Date().toISOString(),
    reason,
  });

  FLAG_REGISTRY.set(flagKey, {
    ...flag,
    enabled,
    strategy: enabled ? (flag.strategy === 'DISABLED' ? 'ALL_USERS' : flag.strategy) : 'DISABLED',
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: changedBy,
  });

  return { success: true };
}

/** Returns a snapshot of all registered flags */
export function getAllFlags(): FeatureFlag[] {
  return Array.from(FLAG_REGISTRY.values());
}

/** Returns the immutable audit trail for this session */
export function getFlagAuditTrail(): FlagAuditEntry[] {
  return [...FLAG_AUDIT_TRAIL];
}

/**
 * Stable deterministic hash for percentage-based bucketing.
 * Uses djb2 algorithm — fast, collision-resistant for bucketing purposes.
 */
function stableHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) + hash + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
