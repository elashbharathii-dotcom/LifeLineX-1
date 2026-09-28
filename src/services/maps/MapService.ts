import {
  MapCoordinates,
  MapMarkerDescriptor,
  RouteResult,
  MapLoadStatus,
} from './mapTypes';
import { googleMapsLoader } from './googleMapsLoader';
import { routeService } from './RouteService';
import { geocodingService } from './GeocodingService';
import { mapPrivacyService } from './MapPrivacyService';
import { UserRoleType } from '../../types/database';

class MapService {
  public isConfigured(): boolean {
    return googleMapsLoader.isConfigured();
  }

  public getStatus(): MapLoadStatus {
    return googleMapsLoader.getStatus();
  }

  public getErrorMessage(): string | null {
    return googleMapsLoader.getErrorMessage();
  }

  public load(): Promise<typeof google> {
    return googleMapsLoader.load();
  }

  public resetRetry() {
    googleMapsLoader.resetRetry();
  }

  public calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return routeService.calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
  }

  public calculateRoute(origin: [number, number], destination: [number, number]): Promise<RouteResult> {
    return routeService.calculateRoute(origin, destination);
  }

  public reverseGeocode(latitude: number, longitude: number) {
    return geocodingService.reverseGeocode(latitude, longitude);
  }

  public sanitizeMarkers(
    markers: MapMarkerDescriptor[],
    viewerRole: UserRoleType,
    hasActiveEmergency = false
  ): MapMarkerDescriptor[] {
    return markers
      .map((m) => mapPrivacyService.sanitizeMarkerForViewer(m, viewerRole, hasActiveEmergency))
      .filter((m): m is MapMarkerDescriptor => m !== null);
  }

  public getBounds(coordinates: MapCoordinates[]): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
    if (coordinates.length === 0) return null;

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    for (const c of coordinates) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    return { minLat, maxLat, minLng, maxLng };
  }
}

export const mapService = new MapService();
