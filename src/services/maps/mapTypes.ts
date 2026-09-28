// Provider-agnostic Map & Spatial Types for LifelineX

export type MapCategoryType = 'patient' | 'hospital' | 'blood_bank' | 'ambulance' | 'donor' | 'emergency';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapMarkerDescriptor {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: MapCategoryType;
  subtitle?: string;
  badge?: string;
  isPrivacyBlurred?: boolean;
  blurRadiusMeters?: number;
  customData?: Record<string, any>;
}

export interface MapRouteDescriptor {
  id?: string;
  start: [number, number]; // [latitude, longitude]
  end: [number, number];   // [latitude, longitude]
  color?: string;
  waypoints?: [number, number][];
}

export interface RouteResult {
  isAvailable: boolean;
  distanceKm: number | null;
  durationMinutes: number | null;
  polylinePoints?: [number, number][];
  error?: string | null;
  isFallbackEstimate?: boolean;
}

export interface GeocodeResult {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

export type MapLoadStatus = 'UNCONFIGURED' | 'LOADING' | 'LOADED' | 'ERROR' | 'OFFLINE';
