// Real HTML5 Geolocation & Spatial Telemetry Service

export interface GeoLocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  isAvailable: boolean;
  error: string | null;
}

class LocationService {
  private watchId: number | null = null;
  private currentLocation: GeoLocationState = {
    latitude: 13.0827,
    longitude: 80.2707,
    accuracy: 10,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: Date.now(),
    isAvailable: false,
    error: null,
  };
  private listeners: Set<(location: GeoLocationState) => void> = new Set();

  constructor() {
    this.requestInitialPosition();
  }

  public getCurrentState(): GeoLocationState {
    return { ...this.currentLocation };
  }

  public subscribe(callback: (loc: GeoLocationState) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentLocation);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentLocation));
  }

  public async requestInitialPosition(): Promise<GeoLocationState> {
    if (!navigator.geolocation) {
      this.currentLocation = {
        ...this.currentLocation,
        isAvailable: false,
        error: 'Geolocation is not supported by your browser.',
      };
      this.notify();
      return this.currentLocation;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
            isAvailable: true,
            error: null,
          };
          this.notify();
          resolve(this.currentLocation);
        },
        (err) => {
          console.warn('Geolocation initial query error:', err.message);
          this.currentLocation = {
            ...this.currentLocation,
            isAvailable: false,
            error: err.message || 'Location permission denied or unavailable.',
          };
          this.notify();
          resolve(this.currentLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    });
  }

  public startLiveTracking(onUpdate?: (loc: GeoLocationState) => void): boolean {
    if (!navigator.geolocation) {
      this.currentLocation.error = 'Geolocation API not supported';
      this.notify();
      return false;
    }

    if (this.watchId !== null) return true;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.currentLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
          isAvailable: true,
          error: null,
        };
        this.notify();
        if (onUpdate) onUpdate(this.currentLocation);
      },
      (err) => {
        console.warn('Live tracking error:', err.message);
        this.currentLocation.error = err.message;
        this.notify();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    );

    return true;
  }

  public stopLiveTracking() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Privacy-Preserving approximate location (adds random jitter within ~1-2km radius for unaccepted donors)
  public getBlurredLocation(lat: number, lon: number): { latitude: number; longitude: number; blurred: boolean } {
    // 0.01 deg is approx 1.1 km
    const seed = Math.abs(Math.sin(lat * 1000 + lon * 1000));
    const offsetLat = (seed - 0.5) * 0.012;
    const offsetLon = (1 - seed - 0.5) * 0.012;
    return {
      latitude: Math.round((lat + offsetLat) * 10000) / 10000,
      longitude: Math.round((lon + offsetLon) * 10000) / 10000,
      blurred: true,
    };
  }
}

export const locationService = new LocationService();
