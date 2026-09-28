import React from 'react';
import { GoogleMapContainer, MapMarkerItem, MapRouteItem } from './GoogleMapContainer';
import { dbAdapter } from '../../services/databaseAdapter';
import { mapService } from '../../services/maps/MapService';
import { EmergencySession } from '../../types/database';

interface Props {
  patientLocation?: { latitude: number; longitude: number };
  activeEmergency?: EmergencySession | null;
}

export const PatientMap: React.FC<Props> = ({
  patientLocation = { latitude: 13.0827, longitude: 80.2707 },
  activeEmergency,
}) => {
  const hospitals = dbAdapter.getTable('hospitals').filter((h) => h.is_active);
  const bloodBanks = dbAdapter.getTable('blood_banks').filter((b) => b.is_active);
  const ambulances = dbAdapter.getTable('ambulances');

  const markers: MapMarkerItem[] = [
    {
      id: 'patient-loc',
      latitude: patientLocation.latitude,
      longitude: patientLocation.longitude,
      title: 'Your Current Location',
      category: activeEmergency ? 'emergency' : 'patient',
      subtitle: activeEmergency ? `Active Emergency: ${activeEmergency.session_code}` : 'Verified Patient Position',
      badge: activeEmergency ? 'SOS ACTIVE' : 'YOU',
    },
  ];

  // Add Verified Hospitals
  hospitals.forEach((h) => {
    markers.push({
      id: h.id,
      latitude: h.latitude,
      longitude: h.longitude,
      title: h.name,
      category: 'hospital',
      subtitle: `${h.icu_beds_available} ICU Beds available • ${h.phone}`,
      badge: 'VERIFIED HOSPITAL',
    });
  });

  // Add Blood Banks
  bloodBanks.forEach((b) => {
    markers.push({
      id: b.id,
      latitude: b.latitude,
      longitude: b.longitude,
      title: b.name,
      category: 'blood_bank',
      subtitle: `Cold-Chain Transfusion Hub • ${b.phone}`,
      badge: 'BLOOD BANK',
    });
  });

  const routes: MapRouteItem[] = [];

  // If there is an active emergency with an assigned ambulance, show assigned ambulance only
  if (activeEmergency?.assigned_hospital_id) {
    const assignedHospital = hospitals.find((h) => h.id === activeEmergency.assigned_hospital_id);
    if (assignedHospital) {
      routes.push({
        start: [patientLocation.latitude, patientLocation.longitude],
        end: [assignedHospital.latitude, assignedHospital.longitude],
        color: '#ef4444',
      });
    }
  }

  // Assigned ambulance tracker
  const assignedAmb = ambulances.find((a) => a.status !== 'AVAILABLE' && a.current_latitude && a.current_longitude);
  if (assignedAmb && assignedAmb.current_latitude && assignedAmb.current_longitude) {
    markers.push({
      id: assignedAmb.id,
      latitude: assignedAmb.current_latitude,
      longitude: assignedAmb.current_longitude,
      title: `Assigned Ambulance (${assignedAmb.vehicle_number})`,
      category: 'ambulance',
      subtitle: `Status: ${assignedAmb.status} • ALS Equipped`,
      badge: 'LIVE AMBULANCE',
    });
  }

  const sanitizedMarkers = mapService.sanitizeMarkers(markers, 'PATIENT', Boolean(activeEmergency));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="font-semibold uppercase tracking-wider text-emerald-400">Patient Emergency View</span>
        <span>Showing: Verified Trauma Centers, Blood Banks &amp; Assigned Ambulance</span>
      </div>
      <GoogleMapContainer
        center={[patientLocation.latitude, patientLocation.longitude]}
        zoom={13}
        markers={sanitizedMarkers}
        routes={routes}
        height="380px"
        emptyMessage="No healthcare facilities found nearby."
      />
    </div>
  );
};
