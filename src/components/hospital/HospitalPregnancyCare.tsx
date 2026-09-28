import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbAdapter } from '../../services/databaseAdapter';
import {
  PregnancyProfile,
  Hospital,
  Profile,
  Doctor,
  Appointment,
  PregnancyHealthRecord,
  Guardian,
  EmergencySession,
} from '../../types/database';
import { wearableService } from '../../services/wearableService';
import {
  Baby,
  Stethoscope,
  X,
  Search,
  ShieldAlert,
  ChevronRight,
  Watch,
  Heart,
  Activity,
  Radio,
  AlertTriangle,
  Battery,
} from 'lucide-react';


interface HospitalPregnancyCareProps {
  onNavigate?: (tabId: string) => void;
}


export const HospitalPregnancyCare: React.FC<HospitalPregnancyCareProps> = ({ onNavigate: _onNavigate }) => {
  const { profile } = useAuth();

  // 1. Resolve authenticated hospital
  const hospitals = useMemo(() => dbAdapter.getTable('hospitals') as Hospital[], []);
  const activeHospital = useMemo(() => {
    if (profile?.email) {
      const match = hospitals.find(
        (h) => h.email?.toLowerCase() === profile.email?.toLowerCase() ||
               (profile.email?.toLowerCase().includes('apollo') && h.name.toLowerCase().includes('apollo')) ||
               (profile.email?.toLowerCase().includes('fortis') && h.name.toLowerCase().includes('fortis'))
      );
      if (match) return match;
    }
    return hospitals[0] || null;
  }, [hospitals, profile]);

  const hospitalId = activeHospital?.id;

  // 2. State for real persisted data
  const [pregnancyProfiles, setPregnancyProfiles] = useState<PregnancyProfile[]>(() => {
    const all = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    return hospitalId ? all.filter((p) => p.hospital_id === hospitalId && p.status !== 'ARCHIVED') : [];
  });
  const [patientProfiles, setPatientProfiles] = useState<Profile[]>(() => (dbAdapter.getTable('profiles') || []) as Profile[]);
  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const all = (dbAdapter.getTable('doctors') || []) as Doctor[];
    return hospitalId ? all.filter((d) => d.hospital_id === hospitalId) : all;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => (dbAdapter.getTable('appointments') || []) as Appointment[]);
  const [healthRecords, setHealthRecords] = useState<PregnancyHealthRecord[]>(() => (dbAdapter.getTable('pregnancy_health_records') || []) as PregnancyHealthRecord[]);
  const [guardians, setGuardians] = useState<Guardian[]>(() => (dbAdapter.getTable('guardians') || []) as Guardian[]);
  const [emergencies, setEmergencies] = useState<EmergencySession[]>(() => (dbAdapter.getTable('emergency_sessions') || []) as EmergencySession[]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [trimesterFilter, setTrimesterFilter] = useState<'ALL' | '1' | '2' | '3'>('ALL');
  const [dueSoonFilter, setDueSoonFilter] = useState<'ALL' | '7_DAYS' | '30_DAYS'>('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'DUE_DATE' | 'WEEK' | 'RISK'>('DUE_DATE');

  // Detail Modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientModalTab, setPatientModalTab] = useState<'wearable' | 'clinical'>('wearable');
  const [showDetailedTelemetry, setShowDetailedTelemetry] = useState(false);

  // Reload real data scoped to hospital
  const reloadData = useCallback(() => {
    if (!hospitalId) return;

    // Strict Hospital-scoping: Only profiles linked to THIS hospital
    const allPregnancies = (dbAdapter.getTable('pregnancy_profiles') || []) as PregnancyProfile[];
    const linkedPregnancies = allPregnancies.filter(
      (p) => p.hospital_id === hospitalId && p.status !== 'ARCHIVED'
    );
    setPregnancyProfiles(linkedPregnancies);

    setPatientProfiles((dbAdapter.getTable('profiles') || []) as Profile[]);
    setDoctors(((dbAdapter.getTable('doctors') || []) as Doctor[]).filter((d) => d.hospital_id === hospitalId));
    setAppointments((dbAdapter.getTable('appointments') || []) as Appointment[]);
    setHealthRecords((dbAdapter.getTable('pregnancy_health_records') || []) as PregnancyHealthRecord[]);
    setGuardians((dbAdapter.getTable('guardians') || []) as Guardian[]);
    setEmergencies((dbAdapter.getTable('emergency_sessions') || []) as EmergencySession[]);
  }, [hospitalId]);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('pregnancy_profiles', reloadData);
    const unsub2 = dbAdapter.subscribe('appointments', reloadData);
    const unsub3 = dbAdapter.subscribe('emergency_sessions', reloadData);
    const unsub4 = dbAdapter.subscribe('pregnancy_health_records', reloadData);
    const unsub5 = dbAdapter.subscribe('wearable_devices', reloadData);
    const unsub6 = dbAdapter.subscribe('wearable_alerts', reloadData);
    const unsub7 = dbAdapter.subscribe('wearable_vitals_records', reloadData);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [reloadData]);

  // Wearable metrics specifically for THIS hospital
  const wearableMetrics = useMemo(() => {
    if (!hospitalId) {
      return {
        linkedPatientsCount: 0,
        monitoringActiveCount: 0,
        monitoringOfflineCount: 0,
        alertsRequiringReviewCount: 0,
      };
    }
    return wearableService.getHospitalWearableMetrics(hospitalId, pregnancyProfiles);
  }, [hospitalId, pregnancyProfiles]);



  // Derived summaries strictly from persisted data
  const summary = useMemo(() => {
    const total = pregnancyProfiles.length;
    const highRisk = pregnancyProfiles.filter((p) => p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL').length;
    const moderate = pregnancyProfiles.filter((p) => p.risk_level === 'MODERATE').length;
    const lowRisk = pregnancyProfiles.filter((p) => p.risk_level === 'LOW' || !p.risk_level).length;

    const now = new Date().getTime();
    const dueWithin7Days = pregnancyProfiles.filter((p) => {
      if (!p.due_date) return false;
      const due = new Date(p.due_date).getTime();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    const dueWithin30Days = pregnancyProfiles.filter((p) => {
      if (!p.due_date) return false;
      const due = new Date(p.due_date).getTime();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    const activeEmergencies = pregnancyProfiles.filter((p) => {
      return emergencies.some(
        (em) => em.patient_profile_id === p.patient_profile_id && em.status !== 'COMPLETED' && em.status !== 'CANCELLED'
      );
    }).length;

    return {
      total,
      highRisk,
      moderate,
      lowRisk,
      dueWithin7Days,
      dueWithin30Days,
      activeEmergencies,
    };
  }, [pregnancyProfiles, emergencies]);

  // Filtered and sorted patient list
  const filteredPatients = useMemo(() => {
    return pregnancyProfiles
      .filter((preg) => {
        const patient = patientProfiles.find((p) => p.id === preg.patient_profile_id);
        const nameMatch = !searchQuery ||
          patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          preg.patient_profile_id.toLowerCase().includes(searchQuery.toLowerCase());

        if (!nameMatch) return false;

        // Risk filter
        if (riskFilter !== 'ALL') {
          if (riskFilter === 'HIGH' && preg.risk_level !== 'HIGH' && preg.risk_level !== 'CRITICAL') return false;
          if (riskFilter === 'MODERATE' && preg.risk_level !== 'MODERATE') return false;
          if (riskFilter === 'LOW' && preg.risk_level !== 'LOW' && preg.risk_level) return false;
        }

        // Trimester filter
        if (trimesterFilter !== 'ALL') {
          const wk = preg.pregnancy_week || 1;
          if (trimesterFilter === '1' && wk > 13) return false;
          if (trimesterFilter === '2' && (wk <= 13 || wk > 27)) return false;
          if (trimesterFilter === '3' && wk <= 27) return false;
        }

        // Due soon filter
        if (dueSoonFilter !== 'ALL') {
          if (!preg.due_date) return false;
          const due = new Date(preg.due_date).getTime();
          const diffDays = Math.ceil((due - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (dueSoonFilter === '7_DAYS' && (diffDays < 0 || diffDays > 7)) return false;
          if (dueSoonFilter === '30_DAYS' && (diffDays < 0 || diffDays > 30)) return false;
        }

        // Emergency only filter
        if (emergencyOnly) {
          const hasEm = emergencies.some(
            (em) => em.patient_profile_id === preg.patient_profile_id && em.status !== 'COMPLETED' && em.status !== 'CANCELLED'
          );
          if (!hasEm) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'WEEK') {
          return (b.pregnancy_week || 0) - (a.pregnancy_week || 0);
        }
        if (sortBy === 'RISK') {
          const weight = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
          return (weight[b.risk_level || 'LOW'] || 0) - (weight[a.risk_level || 'LOW'] || 0);
        }
        // DUE_DATE
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
  }, [pregnancyProfiles, patientProfiles, searchQuery, riskFilter, trimesterFilter, dueSoonFilter, emergencyOnly, sortBy, emergencies]);

  // Selected patient details
  const selectedPregnancy = useMemo(() => {
    if (!selectedPatientId) return null;
    return pregnancyProfiles.find((p) => p.patient_profile_id === selectedPatientId) || null;
  }, [selectedPatientId, pregnancyProfiles]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return patientProfiles.find((p) => p.id === selectedPatientId) || null;
  }, [selectedPatientId, patientProfiles]);

  const selectedDoctor = useMemo(() => {
    if (!selectedPregnancy?.doctor_id) return null;
    return doctors.find((d) => d.id === selectedPregnancy.doctor_id) || null;
  }, [selectedPregnancy, doctors]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatientId) return [];
    return appointments.filter((a) => a.patient_profile_id === selectedPatientId);
  }, [selectedPatientId, appointments]);

  const selectedPatientRecords = useMemo(() => {
    if (!selectedPregnancy?.id) return [];
    return healthRecords.filter((r) => r.profile_id === selectedPregnancy.id);
  }, [selectedPregnancy, healthRecords]);

  const selectedPatientGuardians = useMemo(() => {
    if (!selectedPatientId) return [];
    return guardians.filter((g) => g.patient_profile_id === selectedPatientId);
  }, [selectedPatientId, guardians]);

  const selectedPatientEmergency = useMemo(() => {
    if (!selectedPatientId) return null;
    return emergencies.find(
      (em) => em.patient_profile_id === selectedPatientId && em.status !== 'COMPLETED' && em.status !== 'CANCELLED'
    ) || null;
  }, [selectedPatientId, emergencies]);

  return (
    <div className="space-y-6 lx-animate-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-default)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-caption font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              Obstetric Care Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] mt-1">
            Pregnancy Care
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Pregnancy patients currently linked to {activeHospital?.name || 'your hospital'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {summary.activeEmergencies > 0 && (
            <div className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              <span>{summary.activeEmergencies} Active SOS</span>
            </div>
          )}
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            Facility: {activeHospital?.name.slice(0, 20)}…
          </span>
        </div>
      </div>

      {/* ── Summary Metrics Strip (Hospital Wearable & Gestational Monitoring) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Pregnant Patients</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {wearableMetrics.linkedPatientsCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Linked to facility</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">Monitoring Active</span>
          <div className="text-2xl font-black text-teal-700 dark:text-teal-400 mt-1 flex items-center gap-1.5">
            <span>{wearableMetrics.monitoringActiveCount}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">ESP32 connected</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Monitoring Offline</span>
          <div className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">
            {wearableMetrics.monitoringOfflineCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Unpaired / offline</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Alerts For Review</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {wearableMetrics.alertsRequiringReviewCount}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Wearable alerts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">High Risk</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {summary.highRisk}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Critical monitoring</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Due &lt; 30 Days</span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {summary.dueWithin30Days}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Pre-admission stage</span>
        </div>
      </div>


      {/* ── Search, Filters, and Controls ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--color-border-default)] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search by patient name or LX-ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setRiskFilter('ALL')}
              className={`lx-btn lx-btn-sm ${riskFilter === 'ALL' ? 'lx-btn-primary' : 'lx-btn-secondary'}`}
            >
              All Risks ({summary.total})
            </button>
            <button
              onClick={() => setRiskFilter('HIGH')}
              className={`lx-btn lx-btn-sm ${riskFilter === 'HIGH' ? 'lx-btn-danger' : 'lx-btn-secondary'}`}
            >
              High ({summary.highRisk})
            </button>
            <button
              onClick={() => setRiskFilter('MODERATE')}
              className={`lx-btn lx-btn-sm ${riskFilter === 'MODERATE' ? 'lx-btn-warning' : 'lx-btn-secondary'}`}
            >
              Moderate ({summary.moderate})
            </button>
            <button
              onClick={() => setRiskFilter('LOW')}
              className={`lx-btn lx-btn-sm ${riskFilter === 'LOW' ? 'lx-btn-success' : 'lx-btn-secondary'}`}
            >
              Low ({summary.lowRisk})
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Trimester:</span>
              <select
                value={trimesterFilter}
                onChange={(e) => setTrimesterFilter(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Trimesters</option>
                <option value="1">1st Trimester (W1-13)</option>
                <option value="2">2nd Trimester (W14-27)</option>
                <option value="3">3rd Trimester (W28-40)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Due Window:</span>
              <select
                value={dueSoonFilter}
                onChange={(e) => setDueSoonFilter(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Due Dates</option>
                <option value="7_DAYS">Due within 7 Days</option>
                <option value="30_DAYS">Due within 30 Days</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-semibold text-rose-600 dark:text-rose-400">Emergency Active Only</span>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="DUE_DATE">Due Date</option>
              <option value="WEEK">Gestational Week</option>
              <option value="RISK">Risk Level</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Patient List / Cards ── */}
      {filteredPatients.length === 0 ? (
        <div className="p-12 rounded-[28px] bg-white dark:bg-slate-900 border border-[var(--color-border-default)] text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Baby className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            0 Active Pregnancy Patients
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {pregnancyProfiles.length === 0
              ? 'Patients linked to this hospital will appear here once an authorized obstetric connection is established.'
              : 'No pregnancy patients match the selected filter criteria.'}
          </p>
          {(riskFilter !== 'ALL' || trimesterFilter !== 'ALL' || dueSoonFilter !== 'ALL' || emergencyOnly || searchQuery) && (
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setTrimesterFilter('ALL');
                setDueSoonFilter('ALL');
                setEmergencyOnly(false);
                setSearchQuery('');
              }}
              className="lx-btn lx-btn-secondary lx-btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((preg) => {
            const patient = patientProfiles.find((p) => p.id === preg.patient_profile_id);
            const doctor = doctors.find((d) => d.id === preg.doctor_id);
            const isEmergency = emergencies.some(
              (em) => em.patient_profile_id === preg.patient_profile_id && em.status !== 'COMPLETED' && em.status !== 'CANCELLED'
            );
            const nextAppt = appointments
              .filter((a) => a.patient_profile_id === preg.patient_profile_id && a.status === 'CONFIRMED')
              .sort((a, b) => new Date(`${a.appointment_date}T${a.start_time || '00:00'}`).getTime() - new Date(`${b.appointment_date}T${b.start_time || '00:00'}`).getTime())[0];

            const week = preg.pregnancy_week || 1;
            const trimesterNum = week <= 13 ? '1st' : week <= 27 ? '2nd' : '3rd';

            return (
              <div
                key={preg.id}
                className={`p-5 rounded-[24px] bg-white dark:bg-slate-900 border transition-all hover:shadow-md flex flex-col justify-between ${
                  isEmergency
                    ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-rose-500/10'
                    : 'border-[var(--color-border-default)]'
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      LX-{preg.patient_profile_id.slice(0, 6).toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isEmergency && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse">
                          SOS Active
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          preg.risk_level === 'HIGH' || preg.risk_level === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : preg.risk_level === 'MODERATE'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}
                      >
                        {preg.risk_level || 'LOW'} RISK
                      </span>
                    </div>
                  </div>

                  {/* Patient Name & Gestation */}
                  <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                    {patient?.full_name || 'Patient ' + preg.patient_profile_id.slice(0, 8)}
                  </h3>

                  <div className="mt-2.5 flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-pink-600 font-bold">
                      <Baby className="w-3.5 h-3.5" />
                      <span>Week {week} ({trimesterNum} Trimester)</span>
                    </div>
                    {preg.blood_group && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {preg.blood_group}
                      </span>
                    )}
                  </div>

                  {/* Due Date & Doctor */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Est. Due Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {preg.due_date ? new Date(preg.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not recorded'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Assigned Doctor:</span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {doctor?.name || 'On-Call Obstetrician'}
                      </span>
                    </div>

                    {nextAppt && (
                      <div className="flex items-center justify-between text-teal-700 dark:text-teal-400 font-medium">
                        <span>Next Prenatal:</span>
                        <span>{new Date(nextAppt.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {nextAppt.start_time}</span>
                      </div>
                    )}

                    {/* Wearable Status Mini Summary */}
                    {(() => {
                      const dev = wearableService.getDeviceForPregnancy(preg.id);
                      const overview = dev ? wearableService.getTodayOverview(preg.id) : null;
                      if (!dev) {
                        return (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                            <Watch className="w-3.5 h-3.5" />
                            <span>No wearable paired</span>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-2 text-[11px] text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/40 p-2 rounded-xl border border-teal-100 dark:border-teal-900/50 space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${dev.connection_status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              <span>{dev.connection_status === 'CONNECTED' ? 'ESP32 Online' : 'Wearable Offline'}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {overview?.lastSyncTimestamp ? new Date(overview.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No sync'}
                            </span>
                          </div>
                          {overview?.latestVitals && (
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-700 dark:text-slate-300">
                              <span>HR: {overview.latestVitals.heartRate} bpm</span>
                              <span>SpO2: {overview.latestVitals.spo2}% ({overview.latestVitals.signalQuality})</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>


                {/* Action button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Updated {new Date(preg.updated_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedPatientId(preg.patient_profile_id)}
                    className="lx-btn lx-btn-secondary lx-btn-sm"
                  >
                    <span>View Patient</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Patient Clinical Detail Modal ── */}
      {selectedPatientId && selectedPregnancy && (
        <div className="lx-modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedPatientId(null)}>
          <div className="lx-modal max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="lx-modal-header flex items-center justify-between pb-3 border-b border-[var(--color-border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 flex items-center justify-center">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Patient ID: LX-{selectedPatientId.slice(0, 8).toUpperCase()}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedPatient?.full_name || 'Patient Details'}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientId(null)}
                className="lx-icon-btn"
                aria-label="Close patient details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="lx-modal-body space-y-5 pt-4">
              {/* Emergency Banner if Active */}
              {selectedPatientEmergency && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 space-y-1 animate-pulse">
                  <div className="font-extrabold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>PREGNANCY EMERGENCY ACTIVE</span>
                  </div>
                  <div>Status: {selectedPatientEmergency.status}</div>
                  <div>Coordinates: [{selectedPatientEmergency.latitude.toFixed(4)}, {selectedPatientEmergency.longitude.toFixed(4)}]</div>
                  {selectedPatientEmergency.triage_notes && (
                    <div>Triage Notes: {selectedPatientEmergency.triage_notes}</div>
                  )}
                </div>
              )}

              {/* Modal Sub-Tabs: Wearable Telemetry (ESP32) vs Clinical Records */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-[var(--color-border-default)]">
                <button
                  onClick={() => setPatientModalTab('wearable')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    patientModalTab === 'wearable'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Watch className="w-3.5 h-3.5" />
                  <span>Wearable Telemetry (ESP32)</span>
                </button>
                <button
                  onClick={() => setPatientModalTab('clinical')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    patientModalTab === 'clinical'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Clinical Records &amp; Timeline</span>
                </button>
              </div>

              {patientModalTab === 'wearable' ? (
                /* Wearable Telemetry & Doctor Monitoring */
                (() => {
                  const wearableAuth = wearableService.getHospitalPatientWearableSummary(hospitalId || '', selectedPregnancy.id);
                  if (!wearableAuth.authorized) {
                    return (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Restricted Telemetric Access</span>
                        </div>
                        <p>This patient is assigned to another medical institution. Hospital data isolation prevents accessing wearable telemetry outside your authorized facility.</p>
                      </div>
                    );
                  }

                  const overview = wearableAuth.overview;
                  const dev = overview?.device;
                  const detailed = showDetailedTelemetry ? wearableService.getHospitalPatientDetailedTelemetry(hospitalId || '', selectedPregnancy.id) : null;

                  return (
                    <div className="space-y-4">
                      {/* Wearable Connection & Hardware Status */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${dev?.connection_status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span className="font-black text-slate-900 dark:text-white">
                              {dev ? dev.device_name : 'No Band Paired'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                              {dev?.mac_address_masked || 'MAC Unknown'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span>Model: {dev?.device_model || 'ESP32-MAX30102-MPU6050'}</span>
                            <span>Firmware: {dev?.firmware_version || 'v1.4.2'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <Battery className="w-4 h-4 text-emerald-600" />
                            <span>{dev?.battery_level || '--'}%</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            overview?.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {overview?.syncStatus || 'OFFLINE'}
                          </span>
                        </div>
                      </div>

                      {/* Doctor Summary Section (Steps, Active, Sleep, HR, SpO2, Movement Alerts, Last Sync) */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Steps Today</span>
                          <div className="text-lg font-black text-teal-700 dark:text-teal-400 mt-0.5">
                            {overview ? `${overview.stepsToday.toLocaleString()} / 7,000` : '--'}
                          </div>
                          <span className="text-[10px] text-slate-400">Target: 7,000 steps</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Time</span>
                          <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                            {overview ? `${overview.activeMinutesToday} min` : '--'}
                          </div>
                          <span className="text-[10px] text-slate-400">Light &amp; moderate</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Sleep Duration</span>
                          <div className="text-lg font-black text-purple-700 dark:text-purple-400 mt-0.5">
                            {overview && overview.sleepDurationMinutesToday > 0
                              ? `${Math.floor(overview.sleepDurationMinutesToday / 60)}h ${overview.sleepDurationMinutesToday % 60}m`
                              : '--'}
                          </div>
                          <span className="text-[10px] text-slate-400">Rest period</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Latest Heart Rate</span>
                          <div className="text-lg font-black text-rose-600 mt-0.5 flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{overview?.latestVitals ? `${overview.latestVitals.heartRate} bpm` : '--'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">MAX30102 Optical</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Latest SpO2 &amp; Signal</span>
                          <div className="text-lg font-black text-teal-700 dark:text-teal-400 mt-0.5 flex items-center gap-1">
                            <Radio className="w-4 h-4" />
                            <span>{overview?.latestVitals ? `${overview.latestVitals.spo2}%` : '--'}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${
                            overview?.latestVitals?.signalQuality === 'GOOD' ? 'text-emerald-600' :
                            overview?.latestVitals?.signalQuality === 'FAIR' ? 'text-teal-600' :
                            'text-amber-600'
                          }`}>
                            Signal: {overview?.latestVitals?.signalQuality || 'NO READING'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Movement Alerts</span>
                          <div className="text-lg font-black text-amber-600 mt-0.5">
                            {overview?.movementAlertsCount || 0}
                          </div>
                          <span className="text-[10px] text-slate-400">Last: {overview?.lastSyncTimestamp ? new Date(overview.lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                        </div>
                      </div>

                      {/* Button to toggle Detailed Telemetry */}
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={() => setShowDetailedTelemetry(!showDetailedTelemetry)}
                          className="lx-btn lx-btn-secondary lx-btn-sm flex items-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>{showDetailedTelemetry ? 'Hide Detailed Telemetry' : 'View Detailed Telemetry & History'}</span>
                        </button>
                        <span className="text-[11px] text-slate-400">
                          Last sync: {overview?.lastSyncTimestamp ? new Date(overview.lastSyncTimestamp).toLocaleString() : 'Pending'}
                        </span>
                      </div>

                      {/* Detailed Telemetry Sub-panel */}
                      {showDetailedTelemetry && detailed && (
                        <div className="space-y-4 pt-2 border-t border-[var(--color-border-default)]">
                          {/* Vitals History Table */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">Recent MAX30102 Vitals Log</span>
                            <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500">
                                  <tr>
                                    <th className="py-1.5 px-3">Time</th>
                                    <th className="py-1.5 px-3">Heart Rate</th>
                                    <th className="py-1.5 px-3">SpO2</th>
                                    <th className="py-1.5 px-3">Signal Contact</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {detailed.vitals?.slice(0, 5).map((v) => (
                                    <tr key={v.id}>
                                      <td className="py-1.5 px-3 font-mono text-[11px]">{new Date(v.measurement_timestamp).toLocaleTimeString()}</td>
                                      <td className="py-1.5 px-3 font-bold text-rose-600">{v.heart_rate} bpm</td>
                                      <td className="py-1.5 px-3 font-bold text-teal-700">{v.spo2}%</td>
                                      <td className="py-1.5 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                          v.signal_quality === 'GOOD' ? 'bg-emerald-100 text-emerald-800' :
                                          v.signal_quality === 'FAIR' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {v.signal_quality}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Movement Events Table */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">MPU6050 Motion &amp; Posture Events</span>
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                              {detailed.movement?.slice(0, 4).map((m) => (
                                <div key={m.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{m.movement_event_type.replace('_', ' ')}</span>
                                    <span className="text-[10px] text-slate-400">Intensity: {m.intensity}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">{new Date(m.movement_timestamp).toLocaleTimeString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Active Wearable Alerts Table */}
                          {wearableAuth.alerts && wearableAuth.alerts.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">Wearable Safety &amp; Device Alerts</span>
                              <div className="space-y-1.5">
                                {wearableAuth.alerts.map((al) => (
                                  <div key={al.id} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs">
                                    <div>
                                      <div className="font-bold text-rose-900 dark:text-rose-300">{al.title}</div>
                                      <div className="text-[11px] text-rose-700 dark:text-rose-400">{al.message}</div>
                                    </div>
                                    {al.status !== 'RESOLVED' && (
                                      <button
                                        onClick={() => {
                                          wearableService.resolveAlert(al.id);
                                          reloadData();
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
                                      >
                                        Resolve
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Clinical Records & Timeline */
                <div className="space-y-5">
                  {/* Gestational Metrics Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Gestational Week</span>
                      <div className="text-xl font-extrabold text-pink-600 mt-0.5">
                        Week {selectedPregnancy.pregnancy_week || 1}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Risk Rating</span>
                      <div className="text-sm font-extrabold mt-1 text-slate-900 dark:text-white">
                        {selectedPregnancy.risk_level || 'LOW'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Group</span>
                      <div className="text-sm font-mono font-bold mt-1 text-slate-900 dark:text-white">
                        {selectedPregnancy.blood_group || selectedPatient?.blood_group || 'Not recorded'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Due Date</span>
                      <div className="text-xs font-bold mt-1 text-slate-900 dark:text-white">
                        {selectedPregnancy.due_date ? new Date(selectedPregnancy.due_date).toLocaleDateString() : 'Not recorded'}
                      </div>
                    </div>
                  </div>

                  {/* Care Team & Assigned Doctor */}
                  <div className="p-4 rounded-2xl border border-[var(--color-border-default)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>Assigned Clinical Care Team</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Doctor: <strong className="text-slate-900 dark:text-white">{selectedDoctor?.name || 'On-Call Obstetrician'}</strong>
                      {selectedDoctor?.qualification && ` (${selectedDoctor.qualification})`}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Facility: <strong className="text-slate-900 dark:text-white">{activeHospital?.name}</strong>
                    </div>
                  </div>

                  {/* Recorded Health Records (Vitals) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>Recent Vitals &amp; Health Records</span>
                      <span className="text-slate-400 font-normal">({selectedPatientRecords.length} recorded)</span>
                    </div>
                    {selectedPatientRecords.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 text-center">
                        No clinical vitals logged yet for this pregnancy profile.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedPatientRecords.slice(0, 5).map((rec) => (
                          <div
                            key={rec.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {rec.blood_pressure ? `BP: ${rec.blood_pressure}` : ''}
                                {rec.weight_kg ? ` • Weight: ${rec.weight_kg}kg` : ''}
                                {rec.heart_rate_bpm ? ` • HR: ${rec.heart_rate_bpm}bpm` : ''}
                                {rec.baby_movement_count ? ` • Kicks: ${rec.baby_movement_count}` : ''}
                              </div>
                              {rec.symptoms && (
                                <div className="text-[11px] text-slate-500 mt-0.5">Symptoms: {rec.symptoms}</div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(rec.record_date || rec.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prenatal Appointments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>Prenatal Appointments</span>
                      <span className="text-slate-400 font-normal">({selectedPatientAppointments.length})</span>
                    </div>
                    {selectedPatientAppointments.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 text-center">
                        No appointments scheduled with this hospital.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {selectedPatientAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {apt.appointment_type || 'Prenatal Checkup'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {apt.appointment_date} at {apt.start_time}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                              {apt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Emergency Guardians */}
                  {selectedPatientGuardians.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Authorized Emergency Guardians
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {selectedPatientGuardians.map((g) => (
                          <div
                            key={g.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="font-bold text-slate-900 dark:text-white">{g.name}</div>
                            <div className="text-[10px] text-slate-400">{g.relationship} • {g.phone_number}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            <div className="lx-modal-footer flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border-default)]">
              <button
                onClick={() => setSelectedPatientId(null)}
                className="lx-btn lx-btn-secondary lx-btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
