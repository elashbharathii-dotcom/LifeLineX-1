import React from 'react';
import { GoogleMapContainer, MapMarkerItem, MapRouteItem } from './GoogleMapContainer';
import { dbAdapter } from '../../services/databaseAdapter';
import { mapService } from '../../services/maps/MapService';

export const AdminMap: React.FC = () => {
  const hospitals = dbAdapter.getTable('hospitals');
  const bloodBanks = dbAdapter.getTable('blood_banks');
  const ambulances = dbAdapter.getTable('ambulances');
  const emergencies = dbAdapter.getTable('emergency_sessions').filter((e) => !['COMPLETED', 'CANCELLED'].includes(e.status));

  const markers: MapMarkerItem[] = [];

  // Hospitals
  hospitals.forEach((h) => {
    markers.push({
      id: h.id,
      latitude: h.latitude,
      longitude: h.longitude,
      title: h.name,
      category: 'hospital',
      subtitle: `Status: ${h.verification_status} • ${h.icu_beds_available} ICU Beds`,
      badge: 'HOSPITAL',
    });
  });

  // Blood Banks
  bloodBanks.forEach((b) => {
    markers.push({
      id: b.id,
      latitude: b.latitude,
      longitude: b.longitude,
      title: b.name,
      category: 'blood_bank',
      subtitle: `Status: ${b.verification_status} • Regional Cold-Chain`,
      badge: 'BLOOD BANK',
    });
  });

  // Ambulances
  ambulances.forEach((a) => {
    if (a.current_latitude && a.current_longitude) {
      markers.push({
        id: a.id,
        latitude: a.current_latitude,
        longitude: a.current_longitude,
        title: `Ambulance ${a.vehicle_number}`,
        category: 'ambulance',
        subtitle: `Status: ${a.status} • Speed: ${a.current_speed_kmh || 0} km/h`,
        badge: a.status,
      });
    }
  });

  // Active Emergencies
  emergencies.forEach((e) => {
    markers.push({
      id: e.id,
      latitude: e.latitude,
      longitude: e.longitude,
      title: `Emergency ${e.session_code}`,
      category: 'emergency',
      subtitle: `Status: ${e.status} • Dispatched`,
      badge: 'SOS',
    });
  });

  const routes: MapRouteItem[] = [];
  const sanitizedMarkers = mapService.sanitizeMarkers(markers, 'LIFELINEX_ADMIN');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider text-purple-400">Master Administrative Oversight Grid</span>
        <span>Aggregated Network Overview • Total Nodes: {sanitizedMarkers.length}</span>
      </div>
      <GoogleMapContainer
        center={[13.0827, 80.2707]}
        zoom={12}
        markers={sanitizedMarkers}
        routes={routes}
        height="440px"
        emptyMessage="No active infrastructure nodes registered."
      />
    </div>
  );
};
