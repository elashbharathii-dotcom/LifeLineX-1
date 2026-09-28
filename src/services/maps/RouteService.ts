import { RouteResult } from './mapTypes';
import { googleMapsLoader } from './googleMapsLoader';

class RouteService {
  /**
   * Calculates driving road route, distance, and duration using Google Maps DirectionsService.
   * If Directions API is unavailable or unconfigured, returns clean fallback calculation
   * with explicit isFallbackEstimate indicator (never pretending to be real road route).
   */
  public async calculateRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteResult> {
    if (!googleMapsLoader.isConfigured()) {
      const directKm = this.calculateHaversineDistanceKm(origin[0], origin[1], destination[0], destination[1]);
      return {
        isAvailable: false,
        distanceKm: directKm,
        durationMinutes: null,
        polylinePoints: [origin, destination],
        error: 'Live routing is unconfigured. Direct line distance shown.',
        isFallbackEstimate: true,
      };
    }

    try {
      const google = await googleMapsLoader.load();
      const directionsService = new google.maps.DirectionsService();

      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin[0], origin[1]),
        destination: new google.maps.LatLng(destination[0], destination[1]),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      return new Promise<RouteResult>((resolve) => {
        directionsService.route(
          request,
          (result: any, status: any) => {
            if (status === 'OK' && result && result.routes[0]?.legs[0]) {
              const leg = result.routes[0].legs[0];
              const distanceMeters = leg.distance?.value || 0;
              const durationSecs = leg.duration?.value || 0;

              const polylinePoints: [number, number][] = (result.routes[0].overview_path || []).map(
                (p: google.maps.LatLng) => [p.lat(), p.lng()]
              );

            resolve({
              isAvailable: true,
              distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
              durationMinutes: Math.round(durationSecs / 60),
              polylinePoints,
              error: null,
              isFallbackEstimate: false,
            });
          } else {
            const directKm = this.calculateHaversineDistanceKm(origin[0], origin[1], destination[0], destination[1]);
            resolve({
              isAvailable: false,
              distanceKm: directKm,
              durationMinutes: null,
              polylinePoints: [origin, destination],
              error: `Road routing unavailable (${status}). Direct line distance shown.`,
              isFallbackEstimate: true,
            });
          }
        });
      });
    } catch (err: any) {
      const directKm = this.calculateHaversineDistanceKm(origin[0], origin[1], destination[0], destination[1]);
      return {
        isAvailable: false,
        distanceKm: directKm,
        durationMinutes: null,
        polylinePoints: [origin, destination],
        error: err?.message || 'Routing service unavailable.',
        isFallbackEstimate: true,
      };
    }
  }

  /**
   * Haversine formula for straight-line geometric distance.
   */
  public calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

export const routeService = new RouteService();
