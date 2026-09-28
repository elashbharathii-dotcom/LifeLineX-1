import React, { useEffect, useRef, useState } from 'react';
import { googleMapsLoader } from '../../services/maps/googleMapsLoader';
import { MapLoadStatus, MapMarkerDescriptor, MapRouteDescriptor } from '../../services/maps/mapTypes';
import {
  MapPin,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Building,
  Droplet,
  Truck,
  Shield,
  Loader2,
  Info,
} from 'lucide-react';

export type MapMarkerItem = MapMarkerDescriptor;
export type MapRouteItem = MapRouteDescriptor;

interface Props {
  center?: [number, number];
  zoom?: number;
  markers: MapMarkerItem[];
  routes?: MapRouteItem[];
  height?: string;
  emptyMessage?: string;
  onMarkerClick?: (marker: MapMarkerItem) => void;
}

// Tailored dark theme style for Google Maps to seamlessly match LifelineX aesthetics
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0b0f19' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0f19' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#020617' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
];

const getCategoryColor = (cat: string): string => {
  switch (cat) {
    case 'emergency':
      return '#ef4444'; // Red
    case 'patient':
      return '#06b6d4'; // Cyan
    case 'hospital':
      return '#3b82f6'; // Blue
    case 'blood_bank':
      return '#e11d48'; // Rose
    case 'ambulance':
      return '#eab308'; // Amber/Yellow
    case 'donor':
      return '#10b981'; // Emerald
    default:
      return '#6366f1';
  }
};

const getCategoryIconSymbol = (cat: string): string => {
  switch (cat) {
    case 'emergency':
      return '🚨';
    case 'patient':
      return '👤';
    case 'hospital':
      return '🏥';
    case 'blood_bank':
      return '🩸';
    case 'ambulance':
      return '🚑';
    case 'donor':
      return '❤️';
    default:
      return '📍';
  }
};

export const GoogleMapContainer: React.FC<Props> = ({
  center = [13.0827, 80.2707],
  zoom = 13,
  markers,
  routes = [],
  height = '420px',
  emptyMessage = 'No healthcare facilities found nearby.',
  onMarkerClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [loadStatus, setLoadStatus] = useState<MapLoadStatus>(googleMapsLoader.getStatus());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Initialize Maps API and subscribe to loader events
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!googleMapsLoader.isConfigured()) {
        setLoadStatus('UNCONFIGURED');
        return;
      }

      setLoadStatus('LOADING');
      try {
        await googleMapsLoader.load();
        if (isMounted) {
          setLoadStatus('LOADED');
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadStatus(googleMapsLoader.getStatus());
          setErrorMessage(err?.message || 'Unable to load map.');
        }
      }
    };

    initMap();

    const unsubscribe = googleMapsLoader.subscribe((status, error) => {
      if (isMounted) {
        setLoadStatus(status);
        if (error) {
          setErrorMessage(error);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Mount Google Map once API is loaded
  useEffect(() => {
    if (loadStatus !== 'LOADED' || !containerRef.current) return;

    if (!mapInstanceRef.current) {
      try {
        if (!window.google?.maps?.Map) {
          throw new Error('Google Maps Map constructor is not available.');
        }

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        infoWindowRef.current = new google.maps.InfoWindow();
        mapInstanceRef.current = map;
        setMapInstance(map);

        setTimeout(() => {
          if (mapInstanceRef.current && window.google?.maps?.event) {
            google.maps.event.trigger(mapInstanceRef.current, 'resize');
          }
        }, 100);
      } catch (err: any) {
        console.error('[GoogleMapContainer] Failed to initialize map:', err);
        setLoadStatus('ERROR');
        setErrorMessage(err?.message || 'Unable to load map.');
      }
    }
  }, [loadStatus, center, zoom]);

  // Update Markers, Circles, and Routes
  useEffect(() => {
    const map = mapInstance || mapInstanceRef.current;
    if (!map || loadStatus !== 'LOADED') return;

    try {
      // Clear existing overlays
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Render Markers & Privacy Circles
    markers.forEach((m) => {
      const pos = { lat: m.latitude, lng: m.longitude };
      bounds.extend(pos);
      hasPoints = true;

      const color = getCategoryColor(m.category);
      const iconEmoji = getCategoryIconSymbol(m.category);

      if (m.isPrivacyBlurred) {
        // Privacy-Preserving radius circle (e.g. for donors)
        const circle = new google.maps.Circle({
          strokeColor: '#10b981',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#10b981',
          fillOpacity: 0.2,
          map,
          center: pos,
          radius: m.blurRadiusMeters || 800,
        });

        circle.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="font-family: system-ui, sans-serif; padding: 4px 6px; color: #0f172a; max-width: 220px;">
                <div style="font-size: 11px; font-weight: bold; color: #047857; margin-bottom: 2px;">
                  🔒 PRIVACY-PROTECTED DONOR
                </div>
                <div style="font-weight: 700; font-size: 13px; color: #111827;">${m.title}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.3;">
                  Approximate ~800m area. Exact residential address is strictly protected by LifelineX privacy protocol.
                </div>
              </div>
            `);
            infoWindowRef.current.setPosition(pos);
            infoWindowRef.current.open(map);
          }
        });

        circlesRef.current.push(circle);
      } else {
        // Standard accessible marker with custom SVG pin
        const svgIcon = {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          scale: 9,
        };

        const marker = new google.maps.Marker({
          position: pos,
          map,
          title: m.title,
          icon: svgIcon,
          label: {
            text: iconEmoji,
            fontSize: '12px',
          },
        });

        marker.addListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick(m);
          }

          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div style="font-family: system-ui, sans-serif; padding: 6px 8px; color: #0f172a; min-width: 180px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${color}; margin-bottom: 2px;">
                  ${m.badge || m.category.replace('_', ' ')}
                </div>
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${m.title}</div>
                ${m.subtitle ? `<div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.3;">${m.subtitle}</div>` : ''}
              </div>
            `);
            infoWindowRef.current.open(map, marker);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Render Routes
    routes.forEach((r) => {
      const path = [
        { lat: r.start[0], lng: r.start[1] },
        { lat: r.end[0], lng: r.end[1] },
      ];

      bounds.extend(path[0]);
      bounds.extend(path[1]);
      hasPoints = true;

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: r.color || '#3b82f6',
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map,
      });

      polylinesRef.current.push(polyline);
    });

    // Fit bounds
    if (hasPoints && markers.length > 0) {
      map.fitBounds(bounds, {
        top: 40,
        right: 40,
        bottom: 40,
        left: 40,
      });
      // Prevent over-zooming on single marker
      const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
        if ((map.getZoom() || 13) > 16) {
          map.setZoom(15);
        }
      });
      return () => google.maps.event.removeListener(listener);
    }
  } catch (err: any) {
    console.error('[GoogleMapContainer] Error rendering map overlays:', err);
  }
}, [markers, routes, loadStatus, onMarkerClick, mapInstance]);

  const handleRetry = async () => {
    setIsRetrying(true);
    googleMapsLoader.resetRetry();
    try {
      await googleMapsLoader.load();
      setLoadStatus('LOADED');
    } catch (err: any) {
      setLoadStatus(googleMapsLoader.getStatus());
      setErrorMessage(err?.message || 'Unable to load map.');
    } finally {
      setIsRetrying(false);
    }
  };

  // ─── Unconfigured State: Professional Configuration Guidance Card ─────────
  if (loadStatus === 'UNCONFIGURED') {
    return (
      <div
        className="rounded-2xl border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl"
        style={{
          height,
          background: 'linear-gradient(180deg, #0b1120 0%, #060913 100%)',
          borderColor: 'var(--color-border-default)',
        }}
        role="region"
        aria-label="Google Maps Configuration Required"
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <MapPin className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-bold tracking-tight text-white mb-1">
          Map service is not configured.
        </h3>
        <p className="text-xs max-w-md text-slate-400 leading-relaxed mb-4">
          To enable live Google Maps navigation, telemetry, and hospital routing, set{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700">
            VITE_GOOGLE_MAPS_API_KEY
          </code>{' '}
          in your local development configuration.
        </p>

        {/* Real Facilities Data Summary (Verifies real backend data presence without fake map tiles) */}
        <div className="w-full max-w-md p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Info className="w-3.5 h-3.5" />
              Active Facilities in Operational Grid:
            </span>
            <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">
              {markers.length} Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{markers.filter((m) => m.category === 'hospital').length} Hospitals</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <Droplet className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{markers.filter((m) => m.category === 'blood_bank').length} Blood Banks</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{markers.filter((m) => m.category === 'ambulance').length} Ambulances</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 truncate">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{markers.filter((m) => m.isPrivacyBlurred).length} Privacy Zones</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-3 font-mono">
          Security: Credentials must be kept in .env.local and never committed to source control.
        </p>
      </div>
    );
  }

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loadStatus === 'LOADING') {
    return (
      <div
        className="rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{
          height,
          background: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
        <div className="text-xs font-semibold text-slate-300">Loading map…</div>
        <div className="text-[11px] text-slate-500 mt-0.5">Initializing Google Maps JavaScript API</div>
      </div>
    );
  }

  // ─── Offline State ────────────────────────────────────────────────────────
  if (loadStatus === 'OFFLINE') {
    return (
      <div
        className="rounded-2xl border p-6 flex flex-col items-center justify-center text-center"
        style={{
          height,
          background: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <WifiOff className="w-8 h-8 text-amber-400 mb-2" />
        <div className="text-xs font-bold text-slate-200">You're offline.</div>
        <div className="text-[11px] text-slate-400 max-w-xs mt-1">
          Map data may be unavailable until internet connectivity is restored.
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (loadStatus === 'ERROR') {
    return (
      <div
        className="rounded-2xl border p-6 flex flex-col items-center justify-center text-center"
        style={{
          height,
          background: 'var(--color-bg-subtle)',
          borderColor: 'var(--color-critical-border)',
        }}
      >
        <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
        <div className="text-xs font-bold text-slate-200">Unable to load map.</div>
        <p className="text-[11px] text-slate-400 max-w-sm mt-1 mb-3">
          {errorMessage || 'Google Maps failed to initialize. Please check your network or API key permissions.'}
        </p>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>Retry Map Connection</span>
        </button>
      </div>
    );
  }

  // ─── Loaded State: Interactive Google Map ─────────────────────────────────
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={containerRef} style={{ width: '100%', height }} />

      {/* Empty State Overlay if no markers */}
      {markers.length === 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur shadow-md text-xs text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>{emptyMessage}</span>
        </div>
      )}
    </div>
  );
};
