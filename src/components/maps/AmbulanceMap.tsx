import React from 'react';
import { GoogleMapContainer, MapMarkerItem, MapRouteItem } from './GoogleMapContainer';
import { dbAdapter } from '../../services/databaseAdapter';
import { mapService } from '../../services/maps/MapService';
import { AmbulanceRequest } from '../../types/database';

interface Props {
  currentLocation?: { latitude: number; longitude: number };
  activeAssignment?: AmbulanceRequest | null;
}

export const AmbulanceMap: React.FC<Props> = ({
  currentLocation = { latitude: 13.08, longitude: 80.26 },
  activeAssignment,
}) => {
  const hospitals = dbAdapter.getTable('hospitals');

  const markers: MapMarkerItem[] = [
    {
      id: 'driver-loc',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      title: 'Ambulance (Your Vehicle)',
      category: 'ambulance',
      subtitle: 'Live GPS Telemetry Unit',
      badge: 'YOU',
    },
  ];

  const routes: MapRouteItem[] = [];

  if (activeAssignment) {
    // Pickup Location
    markers.push({
      id: 'pickup-point',
      latitude: activeAssignment.pickup_latitude,
      longitude: activeAssignment.pickup_longitude,
      title: `Pickup: ${activeAssignment.patient_name || 'Emergency Patient'}`,
      category: 'emergency',
      subtitle: activeAssignment.pickup_address,
      badge: 'PICKUP',
    });

    // Route from ambulance to pickup
    routes.push({
      start: [currentLocation.latitude, currentLocation.longitude],
      end: [activeAssignment.pickup_latitude, activeAssignment.pickup_longitude],
      color: '#eab308',
    });

    // Destination Hospital
    if (activeAssignment.destination_latitude && activeAssignment.destination_longitude) {
      const hosp = hospitals.find((h) => h.id === activeAssignment.destination_hospital_id);
      markers.push({
        id: 'dest-hospital',
        latitude: activeAssignment.destination_latitude,
        longitude: activeAssignment.destination_longitude,
        title: hosp ? hosp.name : 'Destination Hospital',
        category: 'hospital',
        subtitle: hosp?.address || 'Trauma Emergency Ward',
        badge: 'DESTINATION',
      });

      // Route from pickup to destination hospital
      routes.push({
        start: [activeAssignment.pickup_latitude, activeAssignment.pickup_longitude],
        end: [activeAssignment.destination_latitude, activeAssignment.destination_longitude],
        color: '#3b82f6',
      });
    }
  }

  const sanitizedMarkers = mapService.sanitizeMarkers(markers, 'AMBULANCE_DRIVER', Boolean(activeAssignment));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider text-amber-400">Driver Navigation Terminal</span>
        <span>
          {activeAssignment
            ? `Active Assignment: ${activeAssignment.request_code} (ETA ~${activeAssignment.eta_minutes || 10}m)`
            : 'Standing by for dispatch'}
        </span>
      </div>
      <GoogleMapContainer
        center={[currentLocation.latitude, currentLocation.longitude]}
        zoom={13}
        markers={sanitizedMarkers}
        routes={routes}
        height="400px"
        emptyMessage="Standing by. Live GPS telemetry active."
      />
    </div>
  );
};
