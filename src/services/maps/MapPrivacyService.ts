import { MapMarkerDescriptor } from './mapTypes';
import { UserRoleType } from '../../types/database';

class MapPrivacyService {
  /**
   * Deterministic privacy-preserving coordinate jitter for donors.
   * Offsets coordinate by ~800m so exact home address is NEVER exposed on map canvas.
   */
  public getBlurredCoordinates(lat: number, lon: number): { latitude: number; longitude: number; radiusMeters: number } {
    const seed = Math.abs(Math.sin(lat * 1000 + lon * 1000));
    const offsetLat = (seed - 0.5) * 0.012;
    const offsetLon = (1 - seed - 0.5) * 0.012;

    return {
      latitude: Math.round((lat + offsetLat) * 10000) / 10000,
      longitude: Math.round((lon + offsetLon) * 10000) / 10000,
      radiusMeters: 800,
    };
  }

  /**
   * Evaluates if a given entity can be shown on the map for the viewer role.
   * Enforces strict RBAC and healthcare privacy rules.
   */
  public sanitizeMarkerForViewer(
    marker: MapMarkerDescriptor,
    viewerRole: UserRoleType,
    hasActiveEmergency = false
  ): MapMarkerDescriptor | null {
    // 1. Donor markers: NEVER expose exact home coordinates under any circumstances
    if (marker.category === 'donor') {
      // Donors themselves viewing their own location
      if (marker.id === 'donor-self') {
        return marker;
      }

      // If viewer is Hospital or Blood Bank, blur coordinates to ~800m approximate area
      if (viewerRole === 'HOSPITAL_ADMIN' || viewerRole === 'HOSPITAL_STAFF' || viewerRole === 'BLOOD_BANK_ADMIN' || viewerRole === 'BLOOD_BANK_STAFF' || viewerRole === 'LIFELINEX_ADMIN' || viewerRole === 'SUPER_ADMIN') {
        const blurred = this.getBlurredCoordinates(marker.latitude, marker.longitude);
        return {
          ...marker,
          latitude: blurred.latitude,
          longitude: blurred.longitude,
          isPrivacyBlurred: true,
          blurRadiusMeters: blurred.radiusMeters,
          subtitle: 'Privacy-Protected Approximate Area (Exact address hidden)',
        };
      }

      // Patient or Ambulance drivers cannot browse arbitrary donor home locations
      return null;
    }

    // 2. Patient / Emergency SOS markers
    if (marker.category === 'patient' || marker.category === 'emergency') {
      // Patient viewing own location
      if (marker.id === 'patient-loc' || marker.id === 'pickup-point') {
        return marker;
      }

      // Hospital viewing assigned or incoming emergency
      if (viewerRole === 'HOSPITAL_ADMIN' || viewerRole === 'HOSPITAL_STAFF') {
        return marker;
      }

      // Ambulance driver only sees assigned pickup point
      if (viewerRole === 'AMBULANCE_DRIVER') {
        if (marker.badge === 'PICKUP' || marker.id === 'pickup-point') {
          return marker;
        }
        return null;
      }

      // Fleet Admin or LifelineX master admin
      if (viewerRole === 'AMBULANCE_PROVIDER_ADMIN' || viewerRole === 'LIFELINEX_ADMIN' || viewerRole === 'SUPER_ADMIN') {
        return marker;
      }

      // Other patients or donors cannot see other patient locations
      return null;
    }

    // 3. Ambulance markers
    if (marker.category === 'ambulance') {
      // Driver viewing own vehicle
      if (marker.id === 'driver-loc') {
        return marker;
      }

      // Patient only sees assigned ambulance during an active emergency
      if (viewerRole === 'PATIENT') {
        if (hasActiveEmergency && (marker.badge === 'LIVE AMBULANCE' || marker.title.includes('Assigned Ambulance'))) {
          return marker;
        }
        return null;
      }

      // Hospital only sees incoming/active ambulances
      if (viewerRole === 'HOSPITAL_ADMIN' || viewerRole === 'HOSPITAL_STAFF') {
        return marker;
      }

      // Fleet Admin & Super Admin
      if (viewerRole === 'AMBULANCE_PROVIDER_ADMIN' || viewerRole === 'LIFELINEX_ADMIN' || viewerRole === 'SUPER_ADMIN') {
        return marker;
      }

      // Donors do not see ambulances
      return null;
    }

    // 4. Hospitals & Blood Banks are public verified healthcare facilities
    if (marker.category === 'hospital' || marker.category === 'blood_bank') {
      return marker;
    }

    return marker;
  }
}

export const mapPrivacyService = new MapPrivacyService();
