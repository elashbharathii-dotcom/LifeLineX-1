/**
 * LifelineX Controlled Pilot Configuration & Feature Flags
 * Governs geographic bounding, feature activation, and fail-safe operational limits.
 */

export interface PilotGeoBoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  name: string;
}

export interface PilotFeatureFlags {
  enableEmergencySOS: boolean;
  enableBloodRequests: boolean;
  enableDonorMatching: boolean;
  enableDonorChain: boolean;
  enableAmbulanceDispatch: boolean;
  enableAppointmentBooking: boolean;
  enableInAppNotifications: boolean;
  enableSmsNotifications: boolean;
  enableAiAssistant: boolean;
  enableAdminVerification: boolean;
}

export interface PilotConfig {
  isPilotActive: boolean;
  clusterName: string;
  geoFence: PilotGeoBoundingBox;
  maxActiveEmergenciesConcurrent: number;
  maxActiveDonorChainsConcurrent: number;
  featureFlags: PilotFeatureFlags;
}

// Default Controlled Pilot Configuration (Chennai Metro Cluster)
export const DEFAULT_PILOT_CONFIG: PilotConfig = {
  isPilotActive: true,
  clusterName: 'Chennai Metro Healthcare Pilot',
  geoFence: {
    minLat: 12.8000,
    maxLat: 13.3000,
    minLon: 80.0000,
    maxLon: 80.4000,
    name: 'Chennai Metro Cluster',
  },
  maxActiveEmergenciesConcurrent: 5,
  maxActiveDonorChainsConcurrent: 3,
  featureFlags: {
    enableEmergencySOS: true,
    enableBloodRequests: true,
    enableDonorMatching: true,
    enableDonorChain: true,
    enableAmbulanceDispatch: true,
    enableAppointmentBooking: true,
    enableInAppNotifications: true,
    enableSmsNotifications: false, // Disabled until live SMS provider credentials exist
    enableAiAssistant: true,       // Coordination assistance only (non-clinical)
    enableAdminVerification: true,
  },
};

/**
 * Validates if coordinates fall within the active pilot cluster.
 */
export function isCoordinateWithinPilotCluster(lat: number, lon: number, config: PilotConfig = DEFAULT_PILOT_CONFIG): boolean {
  if (!config.isPilotActive) return true; // Unrestricted if pilot mode is disabled
  return (
    lat >= config.geoFence.minLat &&
    lat <= config.geoFence.maxLat &&
    lon >= config.geoFence.minLon &&
    lon <= config.geoFence.maxLon
  );
}

/**
 * Evaluates whether a specific feature flag is permitted during pilot.
 */
export function isFeaturePermitted(feature: keyof PilotFeatureFlags, config: PilotConfig = DEFAULT_PILOT_CONFIG): boolean {
  return config.featureFlags[feature] ?? false;
}
