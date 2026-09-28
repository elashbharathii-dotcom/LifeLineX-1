import React from 'react';
import { GoogleMapContainer, MapMarkerItem, MapRouteItem } from './GoogleMapContainer';
import { dbAdapter } from '../../services/databaseAdapter';
import { mapService } from '../../services/maps/MapService';

interface Props {
  bloodBankId?: string;
}

export const BloodBankMap: React.FC<Props> = ({
  bloodBankId = '44444444-4444-4444-4444-444444444401',
}) => {
  const bloodBanks = dbAdapter.getTable('blood_banks');
  const hospitals = dbAdapter.getTable('hospitals');
  const bloodRequests = dbAdapter.getTable('blood_requests').filter((r) => r.status !== 'COMPLETED');

  const currentBB = bloodBanks.find((b) => b.id === bloodBankId) || bloodBanks[0];

  const markers: MapMarkerItem[] = [
    {
      id: currentBB.id,
      latitude: currentBB.latitude,
      longitude: currentBB.longitude,
      title: currentBB.name,
      category: 'blood_bank',
      subtitle: `Your Central Facility • License: ${currentBB.license_number}`,
      badge: 'YOUR BLOOD BANK',
    },
  ];

  // Connected Hospitals receiving blood supplies
  hospitals.forEach((h) => {
    markers.push({
      id: h.id,
      latitude: h.latitude,
      longitude: h.longitude,
      title: h.name,
      category: 'hospital',
      subtitle: `Emergency Transfusion Destination • ${h.phone}`,
      badge: 'PARTNER HOSPITAL',
    });
  });

  const routes: MapRouteItem[] = [];
  bloodRequests.forEach((req) => {
    const hosp = hospitals.find((h) => h.id === req.hospital_id);
    if (hosp) {
      routes.push({
        start: [currentBB.latitude, currentBB.longitude],
        end: [hosp.latitude, hosp.longitude],
        color: '#e11d48',
      });
    }
  });

  const sanitizedMarkers = mapService.sanitizeMarkers(markers, 'BLOOD_BANK_ADMIN');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider text-rose-400">Blood Bank Supply Network</span>
        <span>Showing: Transfusion Hubs &amp; Hospital Dispatch Corridors</span>
      </div>
      <GoogleMapContainer
        center={[currentBB.latitude, currentBB.longitude]}
        zoom={12}
        markers={sanitizedMarkers}
        routes={routes}
        height="400px"
        emptyMessage="No partner hospitals or facilities active in this sector."
      />
    </div>
  );
};
