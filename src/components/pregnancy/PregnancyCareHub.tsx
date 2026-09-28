import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { pregnancyService } from '../../services/pregnancyService';
import { hospitalService } from '../../services/hospitalService';
import { appointmentService } from '../../services/appointmentService';
import { dbAdapter } from '../../services/databaseAdapter';
import {
  PregnancyProfile,
  Hospital,
  Appointment,
  BloodGroupType,
  PregnancyHealthRecord,
  Guardian,
  GuardianPriority
} from '../../types/database';
import {
  Baby,
  Calendar,
  AlertTriangle,
  Building,
  CheckCircle2,
  Edit3,
  PhoneCall,
  Stethoscope,
  X,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Activity,
  HeartPulse,
  Trash2,
  Users,
  Plus,
  Watch,
} from 'lucide-react';
import { PregnancyMonitoringHub } from './monitoring/PregnancyMonitoringHub';

interface PregnancyCareHubProps {
  onNavigate: (tabId: string) => void;
}

export const PregnancyCareHub: React.FC<PregnancyCareHubProps> = ({ onNavigate }) => {
  const { profile } = useAuth();

  const { triggerSOS } = useEmergency();

  const patientId = profile?.id;
  const userBloodGroup = (profile?.blood_group as BloodGroupType) || 'O+';

  const [activeProfile, setActiveProfile] = useState<PregnancyProfile | null>(() => {
    return patientId ? pregnancyService.getActiveProfile(patientId) : null;
  });

  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    return hospitalService.getAllHospitals();
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    return patientId ? appointmentService.getAppointments(patientId) : [];
  });

  const [healthRecords, setHealthRecords] = useState<PregnancyHealthRecord[]>(() => {
    return activeProfile ? pregnancyService.getHealthRecords(activeProfile.id) : [];
  });

  const [guardians, setGuardians] = useState<Guardian[]>(() => {
    return patientId ? pregnancyService.listGuardiansByPatient(patientId) : [];
  });

  // Modal visibility states
  const [activeCareTab, setActiveCareTab] = useState<'overview' | 'monitoring' | 'appointments' | 'guardians'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingRecord, setIsLoggingRecord] = useState(false);
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for Setup / Edit Profile
  const [formDueDate, setFormDueDate] = useState(() => {
    if (activeProfile?.due_date) return activeProfile.due_date.slice(0, 10);
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 180);
    return defaultDue.toISOString().slice(0, 10);
  });
  const [formWeek, setFormWeek] = useState<number>(() => activeProfile?.pregnancy_week || 14);
  const [formBloodGroup, setFormBloodGroup] = useState<BloodGroupType>(() => activeProfile?.blood_group || userBloodGroup);
  const [formRiskLevel, setFormRiskLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'>(() => activeProfile?.risk_level || 'LOW');
  const [formHospitalId, setFormHospitalId] = useState<string>(() => activeProfile?.hospital_id || hospitals[0]?.id || '');
  const [formNotes, setFormNotes] = useState(() => activeProfile?.notes || '');

  // Form states for Health Record Log
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [recordWeight, setRecordWeight] = useState<string>('64');
  const [recordBloodSugar, setRecordBloodSugar] = useState<string>('95');
  const [recordHeartRate, setRecordHeartRate] = useState<string>('80');
  const [recordKickCount, setRecordKickCount] = useState<string>('10');
  const [recordSymptoms, setRecordSymptoms] = useState('');
  const [recordNotes, setRecordNotes] = useState('');

  // Form states for Guardian
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Spouse');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianPriority, setGuardianPriority] = useState<GuardianPriority>('PRIMARY');

  const reloadData = useCallback(() => {
    if (!patientId) return;
    const active = pregnancyService.getActiveProfile(patientId);
    setActiveProfile(active);
    setHospitals(hospitalService.getAllHospitals());
    setAppointments(appointmentService.getAppointments(patientId));
    setGuardians(pregnancyService.listGuardiansByPatient(patientId));
    if (active) {
      setHealthRecords(pregnancyService.getHealthRecords(active.id));
    } else {
      setHealthRecords([]);
    }
  }, [patientId]);

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('pregnancy_profiles', reloadData);
    const unsub2 = dbAdapter.subscribe('appointments', reloadData);
    const unsub3 = dbAdapter.subscribe('pregnancy_health_records', reloadData);
    const unsub4 = dbAdapter.subscribe('guardians', reloadData);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [reloadData]);

  const openEditModal = () => {
    if (activeProfile) {
      setFormDueDate(activeProfile.due_date ? activeProfile.due_date.slice(0, 10) : '');
      setFormWeek(activeProfile.pregnancy_week || 1);
      setFormBloodGroup(activeProfile.blood_group || userBloodGroup);
      setFormRiskLevel(activeProfile.risk_level || 'LOW');
      setFormHospitalId(activeProfile.hospital_id || (hospitals[0]?.id ?? ''));
      setFormNotes(activeProfile.notes || '');
    }
    setIsEditing(true);
  };

  const hospitalId = activeProfile?.hospital_id;
  const assignedHospital = useMemo(() => {
    if (!hospitalId) return null;
    return hospitals.find((h) => h.id === hospitalId) || null;
  }, [hospitalId, hospitals]);

  const dueDateStr = activeProfile?.due_date;
  const daysRemaining = useMemo(() => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [dueDateStr]);

  const currentWeek = activeProfile?.pregnancy_week || 1;

  const trimester = useMemo(() => {
    if (currentWeek <= 12) return { num: 1, label: 'First Trimester', weeks: 'Weeks 1–12' };
    if (currentWeek <= 26) return { num: 2, label: 'Second Trimester', weeks: 'Weeks 13–26' };
    return { num: 3, label: 'Third Trimester', weeks: 'Weeks 27–40+' };
  }, [currentWeek]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (activeProfile) {
        pregnancyService.updateProfile(activeProfile.id, {
          due_date: formDueDate,
          pregnancy_week: Number(formWeek),
          blood_group: formBloodGroup,
          risk_level: formRiskLevel,
          hospital_id: formHospitalId,
          notes: formNotes.trim(),
          status: 'ACTIVE',
        });
      } else {
        pregnancyService.createProfile({
          patient_profile_id: patientId,
          due_date: formDueDate,
          pregnancy_week: Number(formWeek),
          blood_group: formBloodGroup,
          risk_level: formRiskLevel,
          hospital_id: formHospitalId,
          notes: formNotes.trim(),
          status: 'ACTIVE',
        });
      }
      setIsEditing(false);
      reloadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save pregnancy profile.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveHealthRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;

    try {
      const bp = `${bpSystolic}/${bpDiastolic}`;
      pregnancyService.addHealthRecord({
        profile_id: activeProfile.id,
        record_date: new Date(recordDate).toISOString(),
        blood_pressure: bp,
        weight_kg: recordWeight ? parseFloat(recordWeight) : undefined,
        blood_sugar_mg_dL: recordBloodSugar ? parseFloat(recordBloodSugar) : undefined,
        heart_rate_bpm: recordHeartRate ? parseInt(recordHeartRate, 10) : undefined,
        baby_movement_count: recordKickCount ? parseInt(recordKickCount, 10) : undefined,
        symptoms: recordSymptoms.trim() || undefined,
        notes: recordNotes.trim() || undefined,
        recorded_by: 'PATIENT',
        verified: true,
      });

      setIsLoggingRecord(false);
      setRecordSymptoms('');
      setRecordNotes('');
      reloadData();
    } catch (err) {
      console.error('Failed to log health record', err);
    }
  };

  const handleDeleteHealthRecord = (recordId: string) => {
    if (window.confirm('Delete this health tracking entry?')) {
      pregnancyService.deleteHealthRecord(recordId);
      reloadData();
    }
  };

  const handleSaveGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    if (guardians.length >= 3) {
      alert('Maximum of 3 emergency guardians allowed.');
      return;
    }

    try {
      pregnancyService.addGuardian({
        patient_profile_id: patientId,
        name: guardianName.trim(),
        relationship: guardianRelationship.trim(),
        phone_number: guardianPhone.trim(),
        priority: guardianPriority,
        verification_status: 'VERIFIED',
        notification_status: 'DELIVERED',
      });

      setIsAddingGuardian(false);
      setGuardianName('');
      setGuardianPhone('');
      reloadData();
    } catch (err) {
      console.error('Failed to add guardian', err);
    }
  };

  const handleRemoveGuardian = (guardianId: string) => {
    if (window.confirm('Remove this emergency guardian?')) {
      pregnancyService.removeGuardian(guardianId);
      reloadData();
    }
  };

  const handleDeactivate = () => {
    if (!activeProfile) return;
    if (window.confirm('Are you sure you want to deactivate Pregnancy Mode? Your records remain safely stored.')) {
      pregnancyService.deactivateProfile(activeProfile.id);
      reloadData();
    }
  };

  const handleEmergencySOS = () => {
    if (window.confirm('Initiate Priority Obstetric Emergency SOS dispatch now? Your assigned hospital maternity team will be alerted immediately.')) {
      triggerSOS('OBSTETRIC_EMERGENCY');
      onNavigate('emergency');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="relative overflow-hidden rounded-[28px] p-6 sm:p-10 bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-muted)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-primary)] text-white shadow-md">
              <Baby className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-accent-mint)] text-[var(--color-accent-mint-text)] mb-2">
                Maternal &amp; Fetal Health
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                Pregnancy Care
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1.5 max-w-2xl">
                Your pregnancy journey, connected. Personalized antenatal care, clinical timeline guidance, vital tracking, emergency guardians, and priority obstetric trauma dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeProfile ? (
              <button
                onClick={openEditModal}
                className="lx-btn lx-btn-secondary lx-btn-sm flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Update Details</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="lx-btn lx-btn-primary flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Set Up Pregnancy Mode</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Hero: Your pregnancy journey, connected ── */}
      <div className="rounded-[32px] overflow-hidden bg-white border border-[var(--color-border-default)] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[var(--color-primary)] border border-teal-100">
                <Sparkles className="w-3.5 h-3.5" /> Prenatal Support Network
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                Your pregnancy journey, connected.
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                LifelineX provides 24/7 coordination between your obstetrician, ultrasound clinic, assigned hospital delivery suite, emergency guardians, and rapid-dispatch ambulances.
              </p>
            </div>

            {/* Emergency Obstetric SOS Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-rose-800 tracking-wider block">
                    OBSTETRIC EMERGENCY SUPPORT
                  </span>
                  <span className="text-xs text-rose-700">Experiencing acute symptoms or premature labor? Rapid obstetric trauma dispatch</span>
                </div>
              </div>
              <button
                onClick={handleEmergencySOS}
                className="lx-btn lx-btn-emergency w-full sm:w-auto shrink-0 cursor-pointer"
              >
                Pregnancy Emergency SOS
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src="/images/pregnancy_care_photo.jpg"
              alt="Maternal and prenatal consultation"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </div>

      {/* ── 3. Active Profile Dashboard OR Setup State ── */}
      {activeProfile ? (
        <div className="space-y-8">
          {/* Dashboard Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Current Week */}
            <div className="p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Current Week
              </span>
              <div className="text-2xl font-black text-[var(--color-primary)] mt-1">
                Week {currentWeek}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">
                {trimester.label}
              </span>
            </div>

            {/* Due Date */}
            <div className="p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Due Date
              </span>
              <div className="text-sm font-black text-[var(--color-text-primary)] mt-2">
                {activeProfile.due_date ? new Date(activeProfile.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Estimated</span>
            </div>

            {/* Days Remaining */}
            <div className="p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Days Remaining
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {daysRemaining !== null ? daysRemaining : '--'}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Days to EDD</span>
            </div>

            {/* Blood Group */}
            <div className="p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Blood Group
              </span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {activeProfile.blood_group || userBloodGroup}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Rh Screened</span>
            </div>

            {/* Risk Level */}
            <div className="p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Risk Level
              </span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                    activeProfile.risk_level === 'HIGH' || activeProfile.risk_level === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {activeProfile.risk_level || 'LOW'}
                </span>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-1">Clinical Triage</span>
            </div>

            {/* Assigned Hospital */}
            <div className="p-5 rounded-[24px] bg-white border border-[var(--color-border-default)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-[var(--color-text-secondary)] block">
                Assigned Hospital
              </span>
              <div className="text-xs font-black text-[var(--color-text-primary)] mt-1 truncate" title={assignedHospital?.name || 'Assigned Center'}>
                {assignedHospital?.name || 'General Hospital'}
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Obstetric Unit</span>
            </div>
          </div>

          {/* ── Sub-navigation for Activated Pregnancy Care ── */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-[var(--color-border-default)] shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveCareTab('overview')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeCareTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Baby className="w-4 h-4" />
              <span>Pregnancy Overview</span>
            </button>

            <button
              onClick={() => setActiveCareTab('monitoring')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeCareTab === 'monitoring'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-teal-800 bg-teal-50/60 hover:bg-teal-100/60'
              }`}
            >
              <Watch className="w-4 h-4 text-teal-600" />
              <span>Pregnancy Monitoring</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-wide bg-teal-200/80 text-teal-900">
                ESP32 Wearable
              </span>
            </button>

            <button
              onClick={() => setActiveCareTab('appointments')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeCareTab === 'appointments'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments ({appointments.length})</span>
            </button>

            <button
              onClick={() => setActiveCareTab('guardians')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeCareTab === 'guardians'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Hospital &amp; Care Team</span>
            </button>
          </div>

          {/* ── Sub-view Rendering ── */}
          {activeCareTab === 'monitoring' ? (
            <PregnancyMonitoringHub
              patientId={activeProfile.patient_profile_id}
              pregnancyId={activeProfile.id}
              onTriggerEmergencySOS={handleEmergencySOS}
            />
          ) : (
            /* ── 4. Main Details: 2 Columns ── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Progress, Health Records, Appointments */}
              <div className="lg:col-span-8 space-y-6">
                {/* Wearable Banner inside Overview */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                      <Watch className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase text-teal-900 tracking-wider block">
                        ESP32 Wearable Health Monitoring Active
                      </span>
                      <span className="text-xs text-teal-800">
                        Syncing steps, active time, sleep, heart rate, SpO2 &amp; gentle movement safety checks.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveCareTab('monitoring')}
                    className="lx-btn lx-btn-primary lx-btn-sm w-full sm:w-auto shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Wearable Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Antenatal Care Progress & Guidance */}
                <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[var(--color-text-primary)] flex items-center gap-2">
                      <Baby className="w-5 h-5 text-[var(--color-primary)]" />
                      <span>Pregnancy Care Timeline: {trimester.label} ({trimester.weeks})</span>

                  </h3>
                  <span className="text-xs font-bold text-[var(--color-primary)] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                    Week {currentWeek} of 40
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--color-text-secondary)]">
                    Pregnancy Progress ({Math.min(100, Math.round((currentWeek / 40) * 100))}% Completed)
                  </div>
                  <div className="w-full bg-[#F7F8F6] rounded-full h-3 overflow-hidden border border-[var(--color-border-default)]">
                    <div
                      className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round((currentWeek / 40) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className={`p-3.5 rounded-2xl border ${currentWeek <= 12 ? 'bg-teal-50 border-teal-200' : 'bg-[#F7F8F6] border-[var(--color-border-default)]'}`}>
                    <span className="font-bold text-[var(--color-text-primary)] block">Trimester 1</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">Dating scan, blood screening, folic acid</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${currentWeek > 12 && currentWeek <= 26 ? 'bg-teal-50 border-teal-200' : 'bg-[#F7F8F6] border-[var(--color-border-default)]'}`}>
                    <span className="font-bold text-[var(--color-text-primary)] block">Trimester 2</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">Anomaly scan (18-22w), fetal movement checks</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${currentWeek > 26 ? 'bg-teal-50 border-teal-200' : 'bg-[#F7F8F6] border-[var(--color-border-default)]'}`}>
                    <span className="font-bold text-[var(--color-text-primary)] block">Trimester 3</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)]">Growth scans, birth plan, hospital bag</span>
                  </div>
                </div>

                {activeProfile.notes && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] text-xs">
                    <span className="font-bold text-[var(--color-text-primary)] block mb-1">Doctor Advice &amp; Notes:</span>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{activeProfile.notes}</p>
                  </div>
                )}
              </div>

              {/* Health Tracking Records (BP, Weight, Blood Sugar, Kicks) */}
              <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-[var(--color-text-primary)] flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-[var(--color-primary)]" />
                      <span>Maternal &amp; Fetal Health Tracking</span>
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Log daily vitals and kick counts to share with your obstetrician and hospital care team.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLoggingRecord(true)}
                    className="lx-btn lx-btn-primary lx-btn-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Vitals</span>
                  </button>
                </div>

                {healthRecords.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl bg-[#F7F8F6] border border-dashed border-[var(--color-border-default)]">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[var(--color-text-primary)]">No health records recorded yet</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      Click "Log Vitals" above to record your blood pressure, weight, or fetal kicks.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-bold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">BP (mmHg)</th>
                          <th className="py-2.5 px-3">Weight</th>
                          <th className="py-2.5 px-3">Sugar</th>
                          <th className="py-2.5 px-3">HR</th>
                          <th className="py-2.5 px-3">Kicks</th>
                          <th className="py-2.5 px-3">Notes &amp; Symptoms</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-default)]">
                        {healthRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-[#F7F8F6] transition-colors">
                            <td className="py-3 px-3 font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                              {new Date(rec.record_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                              {rec.blood_pressure || '--'}
                            </td>
                            <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                              {rec.weight_kg ? `${rec.weight_kg} kg` : '--'}
                            </td>
                            <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                              {rec.blood_sugar_mg_dL ? `${rec.blood_sugar_mg_dL} mg/dL` : '--'}
                            </td>
                            <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                              {rec.heart_rate_bpm ? `${rec.heart_rate_bpm} bpm` : '--'}
                            </td>
                            <td className="py-3 px-3 text-teal-700 font-bold whitespace-nowrap">
                              {rec.baby_movement_count !== undefined ? `${rec.baby_movement_count} kicks` : '--'}
                            </td>
                            <td className="py-3 px-3 text-[var(--color-text-secondary)] max-w-xs truncate">
                              {rec.symptoms || rec.notes || 'Normal vitals'}
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteHealthRecord(rec.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Scheduled Antenatal Appointments */}
              <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-[var(--color-text-primary)] flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                    <span>Your Antenatal Appointments</span>
                  </h3>
                  <button
                    onClick={() => onNavigate('appointments')}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                  >
                    Manage Appointments <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--color-text-muted)]">
                    No upcoming consultations found. Visit the Appointments tab to book with your obstetrician.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[var(--color-primary)]">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                              {apt.doctor?.name ? apt.doctor.name : apt.facility_name}
                            </span>
                            <span className="text-[11px] text-[var(--color-text-secondary)]">
                              {apt.appointment_date} at {apt.start_time} • {apt.facility_name}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {apt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Assigned Hospital, Emergency Guardians, Deactivation */}
            <div className="lg:col-span-4 space-y-6">
              {/* Assigned Hospital Card */}
              <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[var(--color-primary)]" />
                  <h3 className="text-base font-black text-[var(--color-text-primary)]">
                    Assigned Hospital Facility
                  </h3>
                </div>

                {assignedHospital ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <h4 className="font-black text-sm text-[var(--color-text-primary)]">{assignedHospital.name}</h4>
                      <p className="text-[var(--color-text-secondary)] mt-0.5">{assignedHospital.address}, {assignedHospital.city}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">Trauma Classification:</span>
                        <span className="font-bold text-[var(--color-text-primary)]">{(assignedHospital as any).trauma_level || 'Level 1'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">NICU Beds:</span>
                        <span className="font-bold text-emerald-700">Available (24/7)</span>
                      </div>
                    </div>

                    <a
                      href={`tel:${assignedHospital.phone}`}
                      className="w-full py-2.5 rounded-full font-bold text-xs bg-teal-50 text-[var(--color-primary)] border border-teal-100 flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Maternity Ward
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-text-secondary)]">No facility assigned yet.</p>
                )}
              </div>

              {/* Emergency Guardians Card */}
              <div className="p-6 rounded-[28px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--color-primary)]" />
                    <h3 className="text-base font-black text-[var(--color-text-primary)]">
                      Emergency Guardians
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {guardians.length}/3
                  </span>
                </div>

                <p className="text-xs text-[var(--color-text-secondary)]">
                  Designated emergency contacts automatically notified during obstetric distress or SOS dispatches.
                </p>

                {guardians.length === 0 ? (
                  <div className="text-center py-4 bg-[#F7F8F6] rounded-2xl border border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
                    No emergency guardians registered.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {guardians.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--color-text-primary)]">{g.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                              {g.priority}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                            {g.relationship} • {g.phone_number}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveGuardian(g.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove guardian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {guardians.length < 3 && (
                  <button
                    onClick={() => setIsAddingGuardian(true)}
                    className="lx-btn lx-btn-secondary lx-btn-sm w-full flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Emergency Guardian</span>
                  </button>
                )}
              </div>

              {/* Deactivate Option */}
              <div className="p-4 rounded-2xl bg-[#F7F8F6] border border-[var(--color-border-default)] flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Concluded journey?</span>
                <button
                  onClick={handleDeactivate}
                  className="font-bold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Deactivate Mode
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      ) : (

        /* Setup Pregnancy Mode Form directly inline */
        <div className="p-6 sm:p-10 rounded-[32px] bg-white border border-[var(--color-border-default)] shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-white shadow-md shrink-0">
              <Baby className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                Set Up Pregnancy Care
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
                Enable Pregnancy Mode to track antenatal scans, monitor trimester milestones, link your delivery hospital, and access priority obstetric emergency triage.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Estimated Due Date (EDD) *
                </label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Current Week (1–40) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="42"
                  required
                  value={formWeek}
                  onChange={(e) => setFormWeek(Math.max(1, Math.min(42, parseInt(e.target.value) || 1)))}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Maternal Blood Group *
                </label>
                <select
                  value={formBloodGroup}
                  onChange={(e) => setFormBloodGroup(e.target.value as BloodGroupType)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                >
                  <option value="O+">O+ (Rh Positive)</option>
                  <option value="O-">O- (Rh Negative)</option>
                  <option value="A+">A+ (Rh Positive)</option>
                  <option value="A-">A- (Rh Negative)</option>
                  <option value="B+">B+ (Rh Positive)</option>
                  <option value="B-">B- (Rh Negative)</option>
                  <option value="AB+">AB+ (Rh Positive)</option>
                  <option value="AB-">AB- (Rh Negative)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Clinical Risk Level *
                </label>
                <select
                  value={formRiskLevel}
                  onChange={(e) => setFormRiskLevel(e.target.value as any)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                >
                  <option value="LOW">Low Risk (Standard Pathway)</option>
                  <option value="MODERATE">Moderate Risk (Close Monitoring)</option>
                  <option value="HIGH">High Risk (Specialist Unit)</option>
                  <option value="CRITICAL">Critical Monitoring</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Assigned Delivery Hospital &amp; Emergency Center
              </label>
              <select
                value={formHospitalId}
                onChange={(e) => setFormHospitalId(e.target.value)}
                className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.address} ({h.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                Doctor Advice / Clinical Notes
              </label>
              <textarea
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g., Prescribed supplements, gestational notes, allergy alerts..."
                className="w-full bg-white border border-[var(--color-border-default)] rounded-2xl p-3.5 text-xs text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="lx-btn lx-btn-primary flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving…' : 'Enable Pregnancy Mode'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 5. Setup / Edit Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)] my-8">
            <button
              onClick={() => setIsEditing(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-white shadow-md">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                  {activeProfile ? 'Update Pregnancy Profile' : 'Set Up Pregnancy Care'}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Your information synchronizes securely with your assigned hospital obstetric team.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Estimated Due Date (EDD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Current Week (1–40) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="42"
                    required
                    value={formWeek}
                    onChange={(e) => setFormWeek(Math.max(1, Math.min(42, parseInt(e.target.value) || 1)))}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Maternal Blood Group *
                  </label>
                  <select
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value as BloodGroupType)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  >
                    <option value="O+">O+ (Rh Positive)</option>
                    <option value="O-">O- (Rh Negative)</option>
                    <option value="A+">A+ (Rh Positive)</option>
                    <option value="A-">A- (Rh Negative)</option>
                    <option value="B+">B+ (Rh Positive)</option>
                    <option value="B-">B- (Rh Negative)</option>
                    <option value="AB+">AB+ (Rh Positive)</option>
                    <option value="AB-">AB- (Rh Negative)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Clinical Risk Level *
                  </label>
                  <select
                    value={formRiskLevel}
                    onChange={(e) => setFormRiskLevel(e.target.value as any)}
                    className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                  >
                    <option value="LOW">Low Risk (Standard Pathway)</option>
                    <option value="MODERATE">Moderate Risk (Close Monitoring)</option>
                    <option value="HIGH">High Risk (Specialist Unit)</option>
                    <option value="CRITICAL">Critical Monitoring</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Assigned Delivery Hospital &amp; Emergency Center
                </label>
                <select
                  value={formHospitalId}
                  onChange={(e) => setFormHospitalId(e.target.value)}
                  className="w-full h-12 bg-white border border-[var(--color-border-default)] rounded-2xl px-4 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                >
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.address} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Doctor Advice / Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g., Prescribed supplements, gestational notes, allergy alerts..."
                  className="w-full bg-white border border-[var(--color-border-default)] rounded-2xl p-3.5 text-xs text-[var(--color-text-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-primary)] shadow-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="lx-btn lx-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="lx-btn lx-btn-primary flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving…' : (activeProfile ? 'Save Changes' : 'Enable Pregnancy Mode')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. Log Health Record Modal ── */}
      {isLoggingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)] my-8">
            <button
              onClick={() => setIsLoggingRecord(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-white shadow-md">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)]">
                  Log Vitals &amp; Health Metrics
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Record daily biometric readings to monitor mother and baby.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveHealthRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Record Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 64.5"
                    value={recordWeight}
                    onChange={(e) => setRecordWeight(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Blood Pressure (Systolic / Diastolic)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="120"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                  <span className="text-slate-400 font-bold">/</span>
                  <input
                    type="number"
                    placeholder="80"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                  <span className="text-xs text-slate-500 shrink-0">mmHg</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-primary)] mb-1">
                    Blood Sugar (mg/dL)
                  </label>
                  <input
                    type="number"
                    placeholder="95"
                    value={recordBloodSugar}
                    onChange={(e) => setRecordBloodSugar(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-primary)] mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="80"
                    value={recordHeartRate}
                    onChange={(e) => setRecordHeartRate(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-primary)] mb-1">
                    Kick Count
                  </label>
                  <input
                    type="number"
                    placeholder="12"
                    value={recordKickCount}
                    onChange={(e) => setRecordKickCount(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Symptoms &amp; Observations
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild headache, ankle swelling, nausea..."
                  value={recordSymptoms}
                  onChange={(e) => setRecordSymptoms(e.target.value)}
                  className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLoggingRecord(false)}
                  className="lx-btn lx-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lx-btn lx-btn-primary flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 7. Add Guardian Modal ── */}
      {isAddingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)] my-8">
            <button
              onClick={() => setIsAddingGuardian(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-white shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)]">
                  Add Emergency Guardian
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Trusted contact automatically alerted in maternal emergencies.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGuardian} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Relationship *
                  </label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  >
                    <option value="Spouse">Spouse / Partner</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Relative">Relative</option>
                    <option value="Friend">Trusted Friend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    Priority *
                  </label>
                  <select
                    value={guardianPriority}
                    onChange={(e) => setGuardianPriority(e.target.value as GuardianPriority)}
                    className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                  >
                    <option value="PRIMARY">PRIMARY (1st Alert)</option>
                    <option value="SECONDARY">SECONDARY (Backup)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full h-11 bg-white border border-[var(--color-border-default)] rounded-xl px-3 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingGuardian(false)}
                  className="lx-btn lx-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lx-btn lx-btn-primary flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Guardian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
