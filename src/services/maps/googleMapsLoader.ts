import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapLoadStatus } from './mapTypes';

type StatusListener = (status: MapLoadStatus, error: string | null) => void;

class GoogleMapsLoaderService {
  private loadPromise: Promise<typeof google> | null = null;
  private status: MapLoadStatus = 'UNCONFIGURED';
  private errorMessage: string | null = null;
  private optionsSet = false;
  private listeners: Set<StatusListener> = new Set();

  constructor() {
    this.checkConfiguration();
    this.setupAuthFailureHandler();
  }

  public getApiKey(): string {
    return (
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) ||
      (typeof window !== 'undefined' && (window as any).__VITE_GOOGLE_MAPS_API_KEY) ||
      ''
    ).trim();
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(
      key &&
      key !== 'YOUR_GOOGLE_MAPS_KEY' &&
      key !== 'your-google-maps-api-key-placeholder' &&
      !key.startsWith('placeholder')
    );
  }

  public getStatus(): MapLoadStatus {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'OFFLINE';
    }
    if (!this.isConfigured()) {
      return 'UNCONFIGURED';
    }
    if (this.status === 'UNCONFIGURED') {
      return 'LOADING';
    }
    return this.status;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(status: MapLoadStatus, error: string | null) {
    this.listeners.forEach((fn) => {
      try {
        fn(status, error);
      } catch (e) {
        console.error('[GoogleMapsLoader] Error in status listener:', e);
      }
    });
  }

  private checkConfiguration() {
    if (this.isConfigured()) {
      this.status = 'LOADING';
    } else {
      this.status = 'UNCONFIGURED';
    }
  }

  private setupAuthFailureHandler() {
    if (typeof window !== 'undefined') {
      const prevHandler = (window as any).gm_authFailure;
      (window as any).gm_authFailure = () => {
        console.error('[GoogleMapsLoader] gm_authFailure: Google Maps rejected the API key or billing is not enabled.');
        this.status = 'ERROR';
        this.errorMessage = 'Google Maps API authentication failed. The API key was rejected or billing/services are not active.';
        this.notify('ERROR', this.errorMessage);
        if (typeof prevHandler === 'function') {
          try {
            prevHandler();
          } catch {
            // ignore
          }
        }
      };
    }
  }

  public async load(): Promise<typeof google> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.status = 'OFFLINE';
      this.errorMessage = "You're offline. Map data may be unavailable.";
      this.notify('OFFLINE', this.errorMessage);
      throw new Error(this.errorMessage);
    }

    if (!this.isConfigured()) {
      this.status = 'UNCONFIGURED';
      this.errorMessage = 'Map service is not configured.';
      this.notify('UNCONFIGURED', this.errorMessage);
      throw new Error(this.errorMessage);
    }

    // Already loaded in global window with Map constructor available
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Map) {
      this.status = 'LOADED';
      return (window as any).google;
    }

    // Return active load promise if in progress
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.status = 'LOADING';
    this.errorMessage = null;

    this.loadPromise = (async () => {
      try {
        if (!this.optionsSet) {
          setOptions({
            key: this.getApiKey(),
            v: 'weekly',
          });
          this.optionsSet = true;
        }

        const mapsLib = await importLibrary('maps');

        if (typeof window !== 'undefined' && (window as any).google?.maps) {
          if (!(window as any).google.maps.Map && mapsLib && (mapsLib as any).Map) {
            (window as any).google.maps.Map = (mapsLib as any).Map;
          }
          if (!(window as any).google.maps.InfoWindow && mapsLib && (mapsLib as any).InfoWindow) {
            (window as any).google.maps.InfoWindow = (mapsLib as any).InfoWindow;
          }
          if (!(window as any).google.maps.Circle && mapsLib && (mapsLib as any).Circle) {
            (window as any).google.maps.Circle = (mapsLib as any).Circle;
          }
          if (!(window as any).google.maps.Polyline && mapsLib && (mapsLib as any).Polyline) {
            (window as any).google.maps.Polyline = (mapsLib as any).Polyline;
          }
          if (!(window as any).google.maps.Marker && mapsLib && (mapsLib as any).Marker) {
            (window as any).google.maps.Marker = (mapsLib as any).Marker;
          }
          if (!(window as any).google.maps.LatLngBounds && mapsLib && (mapsLib as any).LatLngBounds) {
            (window as any).google.maps.LatLngBounds = (mapsLib as any).LatLngBounds;
          }
        }

        if (typeof window !== 'undefined' && (window as any).google?.maps?.Map) {
          this.status = 'LOADED';
          this.notify('LOADED', null);
          return (window as any).google;
        }
        throw new Error('Google Maps Map constructor not ready after loading');
      } catch (err: any) {
        this.status = 'ERROR';
        this.loadPromise = null;
        this.errorMessage = err?.message || 'Unable to load map.';
        this.notify('ERROR', this.errorMessage);
        console.warn('[GoogleMapsLoader] Failed to initialize Google Maps:', this.errorMessage);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  public resetRetry() {
    this.loadPromise = null;
    this.status = this.isConfigured() ? 'LOADING' : 'UNCONFIGURED';
    this.errorMessage = null;
  }
}

export const googleMapsLoader = new GoogleMapsLoaderService();
