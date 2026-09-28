import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  category: 'patient' | 'hospital' | 'blood_bank' | 'ambulance' | 'donor' | 'emergency';
  subtitle?: string;
  badge?: string;
  isPrivacyBlurred?: boolean;
}

export interface MapRouteItem {
  start: [number, number];
  end: [number, number];
  color?: string;
}

interface Props {
  center?: [number, number];
  zoom?: number;
  markers: MapMarkerItem[];
  routes?: MapRouteItem[];
  height?: string;
  onMarkerClick?: (marker: MapMarkerItem) => void;
}

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'emergency':
      return '#ef4444'; // Red
    case 'patient':
      return '#f97316'; // Orange
    case 'hospital':
      return '#3b82f6'; // Blue
    case 'blood_bank':
      return '#e11d48'; // Rose
    case 'ambulance':
      return '#eab308'; // Yellow/Amber
    case 'donor':
      return '#10b981'; // Emerald
    default:
      return '#6366f1';
  }
};

const getCategoryIcon = (cat: string) => {
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

export const LeafletMapContainer: React.FC<Props> = ({
  center = [13.0827, 80.2707],
  zoom = 13,
  markers,
  routes = [],
  height = '420px',
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const centerLat = center[0];
  const centerLng = center[1];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;
    } else {
      mapInstanceRef.current.setView([centerLat, centerLng], zoom);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const lg = layerGroupRef.current;
    lg.clearLayers();

    // Render Markers
    markers.forEach((m) => {
      const color = getCategoryColor(m.category);
      const iconEmoji = getCategoryIcon(m.category);

      if (m.isPrivacyBlurred) {
        // Render blurred radius circle for privacy protection
        const circle = L.circle([m.latitude, m.longitude], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.25,
          radius: 800, // 800m approximate area
          dashArray: '4, 6',
        });
        circle.bindPopup(`
          <div style="font-family: sans-serif; min-width: 140px;">
            <strong style="color: #047857;">${iconEmoji} ${m.title}</strong>
            <p style="margin: 4px 0 0; font-size: 11px; color: #6b7280;">🔒 Privacy-Protected Approximate Area (Exact address hidden)</p>
          </div>
        `);
        circle.addTo(lg);
      } else {
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              cursor: pointer;
            ">
              ${iconEmoji}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px; padding: 2px;">
            <div style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: ${color}; margin-bottom: 2px;">
              ${m.badge || m.category.replace('_', ' ')}
            </div>
            <div style="font-weight: 700; font-size: 13px; color: #111827;">${m.title}</div>
            ${m.subtitle ? `<div style="font-size: 11px; color: #4b5563; margin-top: 3px;">${m.subtitle}</div>` : ''}
          </div>
        `);

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(m));
        }

        marker.addTo(lg);
      }
    });

    // Render Routes
    routes.forEach((r) => {
      const polyline = L.polyline([r.start, r.end], {
        color: r.color || '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
      });
      polyline.addTo(lg);
    });

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [markers, routes, onMarkerClick]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl">
      <div ref={mapContainerRef} style={{ width: '100%', height }} />
    </div>
  );
};
