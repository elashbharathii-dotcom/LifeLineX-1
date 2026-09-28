import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { dbAdapter } from '../../services/databaseAdapter';
import { bloodRequestService } from '../../services/bloodRequestService';
import { HospitalMap } from '../maps/HospitalMap';
import { useAuth } from '../../context/AuthContext';
import {
  Hospital,
  EmergencySession,
  BloodRequest,
  BloodGroupType,
  BloodComponentType,
  PregnancyProfile,
} from '../../types/database';
import {
  Building,
  Activity,
  Droplet,
  Bed,
  Send,
  Clock,
  CheckCircle2,
  Navigation,
  Wind,
  X,
  Baby,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HospitalCommandCenterProps {
  onNavigate?: (tabId: string) => void;
}

export const HospitalCommandCenter: React.FC<HospitalCommandCenterProps> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(() => {
    const hs = dbAdapter.getTable('hospitals');
    return hs[0] || null;
  });
  const [emergencies, setEmergencies] = useState<EmergencySession[]>(() => dbAdapter.getTable('emergency_sessions'));
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>(() => dbAdapter.getTable('blood_requests'));
  const [pregnancyProfiles, setPregnancyProfiles] = useState<PregnancyProfile[]>(() => dbAdapter.getTable('pregnancy_profiles'));
  const [showBloodModal, setShowBloodModal] = useState(false);

  // New Blood Request form state
  const [targetBg, setTargetBg] = useState<BloodGroupType>('O+');
  const [targetComponent, setTargetComponent] = useState<BloodComponentType>('WHOLE_BLOOD');
  const [targetUnits, setTargetUnits] = useState(2);
  const [targetUrgency, setTargetUrgency] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'ROUTINE'>('CRITICAL');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const refreshData = useCallback(() => {
    const hs = dbAdapter.getTable('hospitals');
    setActiveHospital((prev) => (prev ? hs.find((h) => h.id === prev.id) || hs[0] || null : hs[0] || null));
    setEmergencies(dbAdapter.getTable('emergency_sessions'));
    setBloodRequests(dbAdapter.getTable('blood_requests'));
    setPregnancyProfiles(dbAdapter.getTable('pregnancy_profiles'));
  }, []);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('hospitals', refreshData);
    const unsub2 = dbAdapter.subscribe('emergency_sessions', refreshData);
    const unsub3 = dbAdapter.subscribe('blood_requests', refreshData);
    const unsub4 = dbAdapter.subscribe('pregnancy_profiles', refreshData);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [refreshData]);

  // Real Pregnancy Statistics strictly for active hospital
  const linkedPregnancies = useMemo(() => {
    if (!activeHospital?.id) return [];
    return pregnancyProfiles.filter(
      (p: PregnancyProfile) => p.hospital_id === activeHospital.id && p.status !== 'ARCHIVED'
    );
  }, [activeHospital, pregnancyProfiles]);

  const pregnancyStats = useMemo(() => {
    const total = linkedPregnancies.length;
    const highRisk = linkedPregnancies.filter((p: PregnancyProfile) => p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL').length;
    const monitoring = linkedPregnancies.filter((p: PregnancyProfile) => p.risk_level === 'MODERATE' || !p.risk_level).length;
    const now = new Date().getTime();
    const dueSoon = linkedPregnancies.filter((p: PregnancyProfile) => {
      if (!p.due_date) return false;
      const diffDays = Math.ceil((new Date(p.due_date).getTime() - now) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    return { total, highRisk, monitoring, dueSoon };
  }, [linkedPregnancies]);

  const handleCreateBloodRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHospital) return;

    bloodRequestService.createBloodRequest(
      activeHospital.id,
      profile?.id || '11111111-1111-1111-1111-111111111105',
      targetBg,
      targetComponent,
      targetUnits,
      targetUrgency,
      clinicalNotes || 'Emergency trauma patient requiring immediate blood transfusion.',
      'ICU Trauma Patient'
    );

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0f4c47', '#e2f2a4', '#dc2626'],
    });

    setShowBloodModal(false);
    setClinicalNotes('');
    refreshData();
  };

  const handleUpdateBeds = (delta: number) => {
    if (!activeHospital) return;
    const newIcu = Math.max(
      0,
      Math.min(activeHospital.total_icu_beds, activeHospital.icu_beds_available + delta)
    );
    dbAdapter.update('hospitals', activeHospital.id, { icu_beds_available: newIcu });
    refreshData();
  };

  const activeEmergencies = emergencies.filter(
    (e) => !['COMPLETED', 'CANCELLED'].includes(e.status)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-muted)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-primary)] text-white shadow-md">
              <Building className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)]">
                  Level-1 Trauma &amp; Surgical Center
                </span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  Lic: {activeHospital?.registration_number || 'TN-MED-9921'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                {activeHospital?.name || 'Hospital Command Center'}
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Real-time critical care capacity, emergency bed occupancy, incoming ALS trauma dispatch, and cold-chain transfusion requests.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBloodModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all hover:scale-102"
            >
              <Droplet className="w-4 h-4" />
              <span>Request Blood Units</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Clean Large Statistics (ER Beds, ICU, Ventilators, Emergencies, Pregnancy Care) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* ER Beds */}
        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">ER Beds</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[var(--color-primary)] flex items-center justify-center">
              <Bed className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--color-text-primary)]">
            24 <span className="text-xs font-semibold text-[var(--color-text-muted)]">available</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Normal Triage Flow
          </div>
        </div>

        {/* ICU Beds (with quick adjustment) */}
        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">ICU Beds</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleUpdateBeds(1)}
                className="lx-btn lx-btn-secondary lx-btn-sm w-8 h-8 p-0 flex items-center justify-center font-bold text-sm cursor-pointer"
                title="Increase ICU capacity"
              >
                +
              </button>
              <button
                onClick={() => handleUpdateBeds(-1)}
                className="lx-btn lx-btn-secondary lx-btn-sm w-8 h-8 p-0 flex items-center justify-center font-bold text-sm cursor-pointer"
                title="Decrease ICU capacity"
              >
                −
              </button>
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600">
            {activeHospital?.icu_beds_available ?? 8}{' '}
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              / {activeHospital?.total_icu_beds ?? 20} available
            </span>
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)] font-medium">
            Critical care units ready
          </div>
        </div>

        {/* Ventilators */}
        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Ventilators</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--color-text-primary)]">
            5 <span className="text-xs font-semibold text-[var(--color-text-muted)]">available</span>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> High-frequency &amp; invasive
          </div>
        </div>

        {/* Active Emergencies */}
        <div className="p-6 rounded-[28px] bg-rose-50 border border-rose-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Active Emergencies</span>
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-700">
            {activeEmergencies.length} <span className="text-xs font-semibold text-rose-600">active sessions</span>
          </div>
          <div className="mt-2 text-xs text-rose-800 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Real-time EMS coordination
          </div>
        </div>

        {/* Pregnancy Care Summary Card (Part 15 Requirement) */}
        <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600">Pregnancy Care</span>
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <Baby className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {pregnancyStats.total}{' '}
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">linked patients</span>
            </div>
            {pregnancyStats.total > 0 ? (
              <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-1.5 font-medium">
                <span className="text-rose-600 font-bold">{pregnancyStats.highRisk} High Risk</span>
                <span>•</span>
                <span className="text-amber-600 font-bold">{pregnancyStats.monitoring} Monitoring</span>
                <span>•</span>
                <span className="text-blue-600 font-bold">{pregnancyStats.dueSoon} Due Soon</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                Patients linked to this hospital will appear here.
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--color-border-muted)]">
            <button
              onClick={() => onNavigate?.('pregnancy')}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Pregnancy Patients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Grouped Sections: Incoming Emergency Cases & Transfusion Network ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Incoming Cases & Transfusions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Emergency Cases */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-[var(--color-text-primary)]">
                  Active Emergency Cases ({activeEmergencies.length})
                </h3>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                Live Dispatch
              </span>
            </div>

            {activeEmergencies.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--color-text-muted)] space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="font-bold">No critical incoming emergencies</p>
                <p>All emergency bays in standby mode with normal readiness.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEmergencies.map((em) => (
                  <div
                    key={em.id}
                    className="p-4 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[var(--color-text-primary)]">
                          {em.emergency_type?.replace(/_/g, ' ') || 'MEDICAL EMERGENCY'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                          {em.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Coordinates: [{em.latitude?.toFixed(3)}, {em.longitude?.toFixed(3)}]
                      </p>
                    </div>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {new Date(em.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blood Requests & Transfusion Ledger */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-[var(--color-text-primary)]">
                  Active Blood Transfusion Requests ({bloodRequests.length})
                </h3>
              </div>
              <button
                onClick={() => setShowBloodModal(true)}
                className="lx-btn lx-btn-emergency lx-btn-sm flex items-center gap-1 cursor-pointer"
              >
                + New Request
              </button>
            </div>

            {bloodRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--color-text-muted)] space-y-2">
                <Droplet className="w-8 h-8 mx-auto text-slate-300" />
                <p>No active transfusion requests. Inventory is balanced.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bloodRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          {req.units_needed} Units {req.blood_group}
                        </span>
                        <span className="text-xs font-bold text-[var(--color-text-primary)]">
                          {req.component.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {req.clinical_notes || 'Emergency transfusion'}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.urgency === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Hospital Operations Map */}
        <div className="lg:col-span-6 rounded-[28px] overflow-hidden bg-white border border-[var(--color-border-default)] shadow-sm">
          <div className="p-5 border-b border-[var(--color-border-default)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Regional Trauma &amp; Fleet Grid
              </h3>
            </div>
            <span className="text-xs font-bold text-[var(--color-primary)] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Live Fleet Coordinates
            </span>
          </div>

          <div className="h-[520px] w-full">
            <HospitalMap hospitalId={activeHospital?.id} />
          </div>
        </div>
      </div>

      {/* ── 4. Blood Request Modal ── */}
      {showBloodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)] my-8">
            <button
              onClick={() => setShowBloodModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-600 text-white shadow-md">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)]">
                  Request Emergency Blood Units
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Dispatches an instant cross-match query to regional blood banks and voluntary donors.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateBloodRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Target Blood Group *
                  </label>
                  <select
                    value={targetBg}
                    onChange={(e) => setTargetBg(e.target.value as BloodGroupType)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  >
                    {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroupType[]).map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Units Required *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={targetUnits}
                    onChange={(e) => setTargetUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Blood Component *
                </label>
                <select
                  value={targetComponent}
                  onChange={(e) => setTargetComponent(e.target.value as BloodComponentType)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                >
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="PACKED_RED_CELLS">PRBC (Packed Red Blood Cells)</option>
                  <option value="PLATELETS">Platelets</option>
                  <option value="FRESH_FROZEN_PLASMA">FFP (Fresh Frozen Plasma)</option>
                  <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Clinical Urgency *
                </label>
                <select
                  value={targetUrgency}
                  onChange={(e) => setTargetUrgency(e.target.value as any)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                >
                  <option value="CRITICAL">Critical (Trauma / OR Immediate)</option>
                  <option value="HIGH">High (Within 2 Hours)</option>
                  <option value="MEDIUM">Medium (Within 6 Hours)</option>
                  <option value="ROUTINE">Routine Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Patient Diagnosis / Clinical Reason
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g., Severe trauma, massive hemorrhage, scheduled bypass..."
                  className="w-full bg-white border border-[var(--color-border-default)] rounded-2xl p-3 text-xs text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBloodModal(false)}
                  className="px-5 py-3 rounded-full text-xs font-bold text-[var(--color-text-secondary)] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-2 transition-all hover:scale-102"
                >
                  <Send className="w-4 h-4" />
                  Broadcast Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
