import { GeocodeResult } from './mapTypes';
import { googleMapsLoader } from './googleMapsLoader';

class GeocodingService {
  /**
   * Reverse geocodes coordinates to a human-readable street address.
   */
  public async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    if (!googleMapsLoader.isConfigured()) {
      return {
        formattedAddress: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        latitude,
        longitude,
      };
    }

    try {
      const google = await googleMapsLoader.load();
      const geocoder = new google.maps.Geocoder();

      return new Promise<GeocodeResult>((resolve) => {
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              resolve({
                formattedAddress: results[0].formatted_address,
                latitude,
                longitude,
                placeId: results[0].place_id,
              });
            } else {
              resolve({
                formattedAddress: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
                latitude,
                longitude,
              });
            }
          }
        );
      });
    } catch {
      return {
        formattedAddress: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        latitude,
        longitude,
      };
    }
  }

  /**
   * Geocodes a text address to coordinates.
   */
  public async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!googleMapsLoader.isConfigured()) {
      return null;
    }

    try {
      const google = await googleMapsLoader.load();
      const geocoder = new google.maps.Geocoder();

      return new Promise<GeocodeResult | null>((resolve) => {
        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location;
            resolve({
              formattedAddress: results[0].formatted_address,
              latitude: loc.lat(),
              longitude: loc.lng(),
              placeId: results[0].place_id,
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch {
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
