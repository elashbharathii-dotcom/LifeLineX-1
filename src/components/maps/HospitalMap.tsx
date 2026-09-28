import React from 'react';
import { GoogleMapContainer, MapMarkerItem, MapRouteItem } from './GoogleMapContainer';
import { dbAdapter } from '../../services/databaseAdapter';
import { locationService } from '../../services/locationService';
import { mapService } from '../../services/maps/MapService';

interface Props {
  hospitalId?: string;
}

export const HospitalMap: React.FC<Props> = ({
  hospitalId = '33333333-3333-3333-3333-333333333301',
}) => {
  const hospitals = dbAdapter.getTable('hospitals');
  const bloodBanks = dbAdapter.getTable('blood_banks');
  const emergencies = dbAdapter.getTable('emergency_sessions').filter((e) => !['COMPLETED', 'CANCELLED'].includes(e.status));
  const ambulances = dbAdapter.getTable('ambulances');
  const donorProfiles = dbAdapter.getTable('donor_profiles').filter((dp) => dp.availability_status === 'AVAILABLE');
  const profiles = dbAdapter.getTable('profiles');

  const activeHospital = hospitals.find((h) => h.id === hospitalId) || hospitals[0];

  const markers: MapMarkerItem[] = [
    {
      id: activeHospital.id,
      latitude: activeHospital.latitude,
      longitude: activeHospital.longitude,
      title: activeHospital.name,
      category: 'hospital',
      subtitle: `Command Base • ${activeHospital.icu_beds_available} ICU Available`,
      badge: 'YOUR FACILITY',
    },
  ];

  // Verified Blood Banks
  bloodBanks.forEach((bb) => {
    markers.push({
      id: bb.id,
      latitude: bb.latitude,
      longitude: bb.longitude,
      title: bb.name,
      category: 'blood_bank',
      subtitle: `Cold-Chain Transfusion Partner • ${bb.phone}`,
      badge: 'BLOOD BANK',
    });
  });

  // Active Emergencies
  emergencies.forEach((emg) => {
    markers.push({
      id: emg.id,
      latitude: emg.latitude,
      longitude: emg.longitude,
      title: `Emergency SOS (${emg.session_code})`,
      category: 'emergency',
      subtitle: `Status: ${emg.status.replace('_', ' ')} • Triage Alert`,
      badge: 'INCOMING PATIENT',
    });
  });

  // Active Ambulances
  ambulances.forEach((amb) => {
    if (amb.current_latitude && amb.current_longitude) {
      markers.push({
        id: amb.id,
        latitude: amb.current_latitude,
        longitude: amb.current_longitude,
        title: `Ambulance ${amb.vehicle_number}`,
        category: 'ambulance',
        subtitle: `Status: ${amb.status} • Speed: ${amb.current_speed_kmh || 0} km/h`,
        badge: 'ACTIVE FLEET',
      });
    }
  });

  // Privacy-Blurred Donor Candidates
  donorProfiles.forEach((dp) => {
    const p = profiles.find((prof) => prof.id === dp.profile_id);
    if (p?.latitude && p?.longitude) {
      const blurred = locationService.getBlurredLocation(p.latitude, p.longitude);
      markers.push({
        id: dp.id,
        latitude: blurred.latitude,
        longitude: blurred.longitude,
        title: `${dp.blood_group} Potential Donor Area`,
        category: 'donor',
        subtitle: `Verified Donor (${dp.total_donations_count} prior donations)`,
        badge: `${dp.blood_group} DONOR`,
        isPrivacyBlurred: true,
      });
    }
  });

  const routes: MapRouteItem[] = [];
  emergencies.forEach((emg) => {
    routes.push({
      start: [emg.latitude, emg.longitude],
      end: [activeHospital.latitude, activeHospital.longitude],
      color: '#ef4444',
    });
  });

  const sanitizedMarkers = mapService.sanitizeMarkers(markers, 'HOSPITAL_ADMIN');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider text-blue-400">Hospital Command Grid</span>
        <span>Showing: Emergencies, Responders, Partner Blood Banks &amp; Blurred Donor Clusters</span>
      </div>
      <GoogleMapContainer
        center={[activeHospital.latitude, activeHospital.longitude]}
        zoom={12}
        markers={sanitizedMarkers}
        routes={routes}
        height="440px"
        emptyMessage="No emergency incidents or facilities found."
      />
    </div>
  );
};
