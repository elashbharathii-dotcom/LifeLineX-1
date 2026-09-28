import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  resourceDiscoveryService,
  DiscoveredHospital,
  DiscoveredBloodBank,
  DiscoveredAmbulance,
  DiscoveredDonorMatch,
} from '../../services/resourceDiscoveryService';
import { dbAdapter } from '../../services/databaseAdapter';
import { BloodGroupType, Doctor } from '../../types/database';
import { PatientMap } from '../maps/PatientMap';
import {
  Search,
  Building,
  Droplet,
  Truck,
  Users,
  ShieldCheck,
  PhoneCall,
  MapPin,
  Stethoscope,
  HeartPulse,
  Navigation,
} from 'lucide-react';

type DiscoveryCategory = 'HOSPITALS' | 'DOCTORS' | 'BLOOD_BANKS' | 'EMERGENCY' | 'AMBULANCES' | 'DONORS';

export const ResourceDiscoveryHub: React.FC = () => {
  const { activeRole, profile } = useAuth();

  const [category, setCategory] = useState<DiscoveryCategory>('HOSPITALS');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(20);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<BloodGroupType>('O+');
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(null);

  // Origin coordinates (defaults to user profile or Chennai Metro trauma center)
  const origin = useMemo(() => {
    return {
      latitude: profile?.latitude || 13.0827,
      longitude: profile?.longitude || 80.2707,
    };
  }, [profile?.latitude, profile?.longitude]);

  // Determine authorized tabs
  const isMedicalStaff = [
    'HOSPITAL_ADMIN',
    'HOSPITAL_STAFF',
    'BLOOD_BANK_ADMIN',
    'BLOOD_BANK_STAFF',
    'LIFELINEX_ADMIN',
    'SUPER_ADMIN',
  ].includes(activeRole);

  // Queries
  const hospitals: DiscoveredHospital[] = useMemo(() => {
    return resourceDiscoveryService.searchHospitals(
      {
        origin,
        maxDistanceKm: radiusKm,
        verifiedOnly,
        searchQuery,
      },
      activeRole
    );
  }, [origin, radiusKm, verifiedOnly, searchQuery, activeRole]);

  const doctors: Doctor[] = useMemo(() => {
    const rawDocs = (dbAdapter.getTable('doctors') || []) as Doctor[];
    if (!searchQuery) return rawDocs;
    const q = searchQuery.toLowerCase();
    return rawDocs.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.specialty?.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const bloodBanks: DiscoveredBloodBank[] = useMemo(() => {
    return resourceDiscoveryService.searchBloodBanks(
      {
        origin,
        maxDistanceKm: radiusKm,
        verifiedOnly,
        bloodGroup: selectedBloodGroup,
        searchQuery,
      },
      activeRole
    );
  }, [origin, radiusKm, verifiedOnly, selectedBloodGroup, searchQuery, activeRole]);

  const ambulances: DiscoveredAmbulance[] = useMemo(() => {
    return resourceDiscoveryService.searchAmbulances(
      {
        origin,
        maxDistanceKm: radiusKm,
        onlyAvailable: false,
      },
      activeRole
    );
  }, [origin, radiusKm, activeRole]);

  const donorMatches: DiscoveredDonorMatch[] = useMemo(() => {
    if (!isMedicalStaff) return [];
    return resourceDiscoveryService.searchPotentialDonors(
      {
        origin,
        patientBloodGroup: selectedBloodGroup,
        maxDistanceKm: radiusKm,
        verifiedOnly,
      },
      activeRole
    );
  }, [isMedicalStaff, origin, selectedBloodGroup, radiusKm, verifiedOnly, activeRole]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-muted)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-primary)] text-white shadow-md">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
                Geospatial Directory
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                Healthcare near you
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Discover accredited hospitals, top specialists, 24/7 blood banks, trauma facilities, and active ambulances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-teal-50 px-4 py-2.5 rounded-2xl border border-teal-100 text-xs font-semibold text-teal-800 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Verified Healthcare Network</span>
          </div>
        </div>
      </div>

      {/* ── 2. Search & Category Filters Bar ── */}
      <div className="p-4 sm:p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals, doctors, blood banks, ambulances..."
            className="w-full h-12 rounded-2xl pl-12 pr-4 bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] placeholder-slate-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategory('HOSPITALS')}
              className={`lx-btn lx-btn-sm ${
                category === 'HOSPITALS'
                  ? 'lx-btn-primary'
                  : 'lx-btn-secondary'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              onClick={() => setCategory('DOCTORS')}
              className={`lx-btn lx-btn-sm ${
                category === 'DOCTORS'
                  ? 'lx-btn-primary'
                  : 'lx-btn-secondary'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctors ({doctors.length})</span>
            </button>

            <button
              onClick={() => setCategory('BLOOD_BANKS')}
              className={`lx-btn lx-btn-sm ${
                category === 'BLOOD_BANKS'
                  ? 'lx-btn-danger'
                  : 'lx-btn-secondary'
              }`}
            >
              <Droplet className="w-3.5 h-3.5" />
              <span>Blood Banks ({bloodBanks.length})</span>
            </button>

            <button
              onClick={() => setCategory('EMERGENCY')}
              className={`lx-btn lx-btn-sm ${
                category === 'EMERGENCY'
                  ? 'lx-btn-emergency'
                  : 'lx-btn-secondary'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Emergency ER</span>
            </button>

            <button
              onClick={() => setCategory('AMBULANCES')}
              className={`lx-btn lx-btn-sm ${
                category === 'AMBULANCES'
                  ? 'lx-btn-warning'
                  : 'lx-btn-secondary'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Ambulance ({ambulances.length})</span>
            </button>

            {isMedicalStaff && (
              <button
                onClick={() => setCategory('DONORS')}
                className={`lx-btn lx-btn-sm ${
                  category === 'DONORS'
                    ? 'lx-btn-primary'
                    : 'lx-btn-secondary'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Donor Match ({donorMatches.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="h-9 px-3 rounded-xl bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] focus:outline-none"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km (Metro)</option>
              <option value={50}>Within 50 km (State)</option>
            </select>

            {(category === 'BLOOD_BANKS' || category === 'DONORS') && (
              <select
                value={selectedBloodGroup}
                onChange={(e) => setSelectedBloodGroup(e.target.value as BloodGroupType)}
                className="h-9 px-3 rounded-xl bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs text-[var(--color-text-secondary)] focus:outline-none"
              >
                {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroupType[]).map((bg) => (
                  <option key={bg} value={bg}>Blood: {bg}</option>
                ))}
              </select>
            )}

            <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[var(--color-primary)]"
              />
              <span>Verified only</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── 3. Split Layout: Facility List (40%) + Map (60%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Facility List (Desktop: ~40% / 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
            <span className="font-bold uppercase tracking-wider">
              {category} Directory
            </span>
            <span>Origin: Chennai Central</span>
          </div>

          {/* Hospitals */}
          {category === 'HOSPITALS' && (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setActiveFacilityId(h.id)}
                  className={`p-6 rounded-[24px] bg-white border cursor-pointer transition-all duration-200 hover:shadow-md ${
                    activeFacilityId === h.id
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border-default)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--color-primary)] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                          {h.distanceKm} km away
                        </span>
                        {h.hasEmergencyWard && (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Emergency Ward Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-[var(--color-text-primary)] mt-2">
                        {h.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {h.address}, {h.city}
                      </p>
                    </div>
                  </div>

                  {/* Bed Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--color-border-muted)] text-center">
                    <div className="p-2 rounded-xl bg-[#F7F8F6]">
                      <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-bold">Total Beds</span>
                      <span className="text-xs font-black text-emerald-700">{h.totalBeds} capacity</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#F7F8F6]">
                      <span className="text-[10px] text-[var(--color-text-muted)] block uppercase font-bold">ICU Beds</span>
                      <span className="text-xs font-black text-blue-600">{h.icuBedsAvailable} open</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs pt-2">
                    <a
                      href={`tel:${h.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 font-bold text-[var(--color-primary)] hover:underline"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {h.phone}
                    </a>
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                      {h.hasBloodBank ? 'Blood Bank Onsite' : 'External Blood Tie-up'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Doctors */}
          {category === 'DOCTORS' && (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {doctors.map((d) => (
                <div
                  key={d.id}
                  className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all flex items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-[var(--color-primary)]">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--color-primary)] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                        {d.specialty}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {d.is_available ? 'Available' : 'On Leave'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[var(--color-text-primary)] mt-1.5">
                      {d.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {d.qualification || 'MBBS, MD'} • Consultation fee: ₹{d.consultation_fee || 500}
                    </p>
                    <div className="mt-3 pt-3 border-t border-[var(--color-border-muted)] flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-muted)]">Verified Medical Council</span>
                      <span className="font-bold text-[var(--color-primary)]">Consultation Ready</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Blood Banks */}
          {category === 'BLOOD_BANKS' && (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {bloodBanks.map((bb) => (
                <div
                  key={bb.id}
                  className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                        {bb.distanceKm} km away
                      </span>
                      <h3 className="text-base font-black text-[var(--color-text-primary)] mt-2">
                        {bb.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {bb.address}, {bb.city}
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                      {bb.totalAvailableUnits} Units
                    </span>
                  </div>

                  {bb.matchedInventory && (
                    <div className="mt-3 p-3 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">Target Blood Group:</span>
                      <span className="font-black text-rose-600">{bb.matchedInventory.unitsAvailable} Units ({bb.matchedInventory.bloodGroup})</span>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[var(--color-border-muted)] flex items-center justify-between text-xs">
                    <a
                      href={`tel:${bb.phone}`}
                      className="font-bold text-rose-600 hover:underline flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {bb.phone}
                    </a>
                    <span className="text-slate-400 font-mono text-[11px]">Lic: {bb.licenseNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ambulances */}
          {category === 'AMBULANCES' && (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
              {ambulances.map((amb) => (
                <div
                  key={amb.id}
                  className="p-6 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {amb.distanceKm} km away
                    </span>
                    <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {amb.status}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">
                    {amb.vehicleNumber}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {amb.vehicleType} • Speed: {amb.currentSpeedKmh} km/h
                  </p>
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-muted)] flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Telemetry Sync</span>
                    <span className="font-bold text-[var(--color-primary)]">
                      {amb.estimatedEtaMinutes ? `ETA: ~${amb.estimatedEtaMinutes} min` : 'Standby'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Emergency / Fallback */}
          {category === 'EMERGENCY' && (
            <div className="p-6 rounded-[28px] bg-rose-50 border border-rose-200 space-y-4">
              <div className="flex items-center gap-3">
                <HeartPulse className="w-8 h-8 text-rose-600" />
                <div>
                  <h3 className="text-lg font-black text-rose-900">24/7 Emergency Medical Response</h3>
                  <p className="text-xs text-rose-700">Level-1 Trauma and Pediatric Critical Care</p>
                </div>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Emergency response protocols are continuously active across the Chennai trauma network. In life-threatening emergencies, initiate direct SOS via Emergency Center.
              </p>
              <a
                href="tel:108"
                className="w-full py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:bg-rose-700 transition-colors"
              >
                <PhoneCall className="w-4 h-4" /> Call 108 Emergency Dispatch
              </a>
            </div>
          )}
        </div>

        {/* Map View (Desktop: ~60% / 7 cols) */}
        <div className="lg:col-span-7 sticky top-24">
          <div className="rounded-[28px] overflow-hidden bg-white border border-[var(--color-border-default)] shadow-sm">
            <div className="p-5 border-b border-[var(--color-border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Geospatial Healthcare Grid
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Live Geofence: {radiusKm} km
              </span>
            </div>

            <div className="h-[600px] w-full">
              <PatientMap />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
