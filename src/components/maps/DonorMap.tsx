import React from 'react';
import { GoogleMapContainer, MapMarkerItem, MapRouteItem } from './GoogleMapContainer';
import { dbAdapter } from '../../services/databaseAdapter';
import { mapService } from '../../services/maps/MapService';

interface Props {
  donorLocation?: { latitude: number; longitude: number };
  acceptedDestination?: { name: string; latitude: number; longitude: number } | null;
}

export const DonorMap: React.FC<Props> = ({
  donorLocation = { latitude: 13.085, longitude: 80.275 },
  acceptedDestination,
}) => {
  const hospitals = dbAdapter.getTable('hospitals').filter((h) => h.is_active);
  const bloodBanks = dbAdapter.getTable('blood_banks').filter((b) => b.is_active);

  const markers: MapMarkerItem[] = [
    {
      id: 'donor-self',
      latitude: donorLocation.latitude,
      longitude: donorLocation.longitude,
      title: 'Your Location (Donor)',
      category: 'donor',
      subtitle: 'Verified Blood Donor',
      badge: 'YOU',
    },
  ];

  // Donation Centers & Blood Banks
  bloodBanks.forEach((b) => {
    markers.push({
      id: b.id,
      latitude: b.latitude,
      longitude: b.longitude,
      title: b.name,
      category: 'blood_bank',
      subtitle: `Open for Whole Blood & Platelet Donation • ${b.phone}`,
      badge: 'DONATION HUB',
    });
  });

  // Hospitals with Blood Transfusion Services
  hospitals.forEach((h) => {
    markers.push({
      id: h.id,
      latitude: h.latitude,
      longitude: h.longitude,
      title: h.name,
      category: 'hospital',
      subtitle: `Authorized Donation Center • ${h.address}`,
      badge: 'HOSPITAL WARD',
    });
  });

  const routes: MapRouteItem[] = [];
  if (acceptedDestination) {
    markers.push({
      id: 'accepted-dest',
      latitude: acceptedDestination.latitude,
      longitude: acceptedDestination.longitude,
      title: acceptedDestination.name,
      category: 'emergency',
      subtitle: 'Your Accepted Donation Destination',
      badge: 'DESTINATION',
    });
    routes.push({
      start: [donorLocation.latitude, donorLocation.longitude],
      end: [acceptedDestination.latitude, acceptedDestination.longitude],
      color: '#10b981',
    });
  }

  const sanitizedMarkers = mapService.sanitizeMarkers(markers, 'DONOR');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider text-rose-400">Donor Navigation Grid</span>
        <span>Showing: Approved Donation Centers &amp; Transfusion Facilities</span>
      </div>
      <GoogleMapContainer
        center={[donorLocation.latitude, donorLocation.longitude]}
        zoom={13}
        markers={sanitizedMarkers}
        routes={routes}
        height="380px"
        emptyMessage="No approved donation centers found nearby."
      />
    </div>
  );
};
