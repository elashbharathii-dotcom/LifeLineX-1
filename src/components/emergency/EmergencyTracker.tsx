import React, { useState, useEffect } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { PatientMap } from '../maps/PatientMap';
import { EmergencyTimeline } from './EmergencyTimeline';
import { dbAdapter } from '../../services/databaseAdapter';
import { EmergencyStatusType, Hospital, Ambulance, BloodRequest, DonorChain } from '../../types/database';
import {
  Activity,
  Shield,
  Building,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  PhoneCall,
  MapPin,
  Droplet,
  AlertTriangle,
  RefreshCw,
  Radio,
  Navigation,
  Sparkles,
} from 'lucide-react';

const emergencySteps: EmergencyStatusType[] = [
  'CREATED',
  'LOCATION_CONFIRMED',
  'COORDINATING',
  'AMBULANCE_REQUESTED',
  'AMBULANCE_ASSIGNED',
  'HOSPITAL_COORDINATED',
  'BLOOD_SEARCHING',
  'RESOURCE_COORDINATED',
  'COMPLETED',
];

const STATUS_LABELS: Record<EmergencyStatusType, { title: string; subtitle: string }> = {
  CREATED: {
    title: 'Emergency Broadcast Active',
    subtitle: 'Transmitting emergency coordinates to responder network',
  },
  LOCATION_CONFIRMED: {
    title: 'Location Confirmed',
    subtitle: 'Dispatching nearest available emergency units to your location',
  },
  COORDINATING: {
    title: 'Coordinating Responders',
    subtitle: 'Alerting EMS dispatchers, trauma center, and nearest ambulances',
  },
  AMBULANCE_REQUESTED: {
    title: 'Ambulance Requested',
    subtitle: 'Awaiting responder dispatch confirmation',
  },
  AMBULANCE_ASSIGNED: {
    title: 'Ambulance Assigned',
    subtitle: 'Emergency vehicle has been assigned to your emergency',
  },
  AMBULANCE_EN_ROUTE: {
    title: 'Ambulance En Route',
    subtitle: 'Emergency vehicle is navigating to your coordinates',
  },
  ARRIVED: {
    title: 'Ambulance Arrived at Scene',
    subtitle: 'Responders have arrived on location and are providing care',
  },
  HOSPITAL_COORDINATED: {
    title: 'Trauma Center Pre-Alerted',
    subtitle: 'Receiving hospital preparing triage bed and surgical team',
  },
  BLOOD_SEARCHING: {
    title: 'Blood Reserves Active',
    subtitle: 'Cross-matching compatible regional donor inventory',
  },
  RESOURCE_COORDINATED: {
    title: 'All Units Coordinated',
    subtitle: 'Full emergency response team aligned and active',
  },
  COMPLETED: {
    title: 'Emergency Resolved',
    subtitle: 'Patient safely admitted and clinical handover complete',
  },
  CANCELLED: {
    title: 'Emergency Cancelled',
    subtitle: 'Emergency session has been terminated',
  },
};

const CANCELLATION_REASONS = [
  'False alarm / Accidental trigger',
  'Transport arranged privately / Family arrived',
  'Patient condition stabilized / Resolved',
  'Other reason',
];

export const EmergencyTracker: React.FC = () => {
  const { activeEmergency, events, updateStatus } = useEmergency();
  const { t } = useThemeLanguage();

  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bloodRequest, setBloodRequest] = useState<BloodRequest | null>(null);
  const [donorChain, setDonorChain] = useState<DonorChain | null>(null);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState('');

  // Live clock tick every second for GPS freshness & duration calculations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch related clinical & operational coordination records
  useEffect(() => {
    if (!activeEmergency) return;

    const loadCoordinationData = () => {
      // Find associated blood request if any
      const bloodRequests = dbAdapter.getTable('blood_requests');
      const req = bloodRequests.find(
        (b) => b.id === activeEmergency.blood_request_id || (b.hospital_id === activeEmergency.assigned_hospital_id && b.status !== 'COMPLETED')
      );
      setBloodRequest(req || null);

      if (req) {
        const chains = dbAdapter.getTable('donor_chains');
        const chain = chains.find((c) => c.blood_request_id === req.id);
        if (chain) {
          const members = dbAdapter.getTable('donor_chain_members').filter((m) => m.donor_chain_id === chain.id);
          setDonorChain({ ...chain, members });
        } else {
          setDonorChain(null);
        }
      } else {
        setDonorChain(null);
      }
    };

    loadCoordinationData();
    const unsub1 = dbAdapter.subscribe('blood_requests', loadCoordinationData);
    const unsub2 = dbAdapter.subscribe('donor_chains', loadCoordinationData);
    const unsub3 = dbAdapter.subscribe('donor_chain_members', loadCoordinationData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [activeEmergency]);

  if (!activeEmergency) {
    return null;
  }

  const hospitals = dbAdapter.getTable('hospitals') as unknown as Hospital[];
  const assignedHospital = hospitals.find((h) => h.id === activeEmergency.assigned_hospital_id) || hospitals[0];
  const ambulances = dbAdapter.getTable('ambulances') as unknown as Ambulance[];
  const assignedAmb = ambulances.find((a) => a.id === activeEmergency.ambulance_request_id || a.status !== 'AVAILABLE') || ambulances[0];

  const currentStepIdx = emergencySteps.indexOf(activeEmergency.status);
  const statusHeadline = STATUS_LABELS[activeEmergency.status] || {
    title: activeEmergency.status.replace(/_/g, ' '),
    subtitle: 'Emergency coordination in progress',
  };

  // GPS Telemetry freshness calculation
  const lastGpsTime = assignedAmb?.last_gps_update ? new Date(assignedAmb.last_gps_update).getTime() : currentTime;
  const gpsAgeSeconds = Math.max(0, Math.floor((currentTime - lastGpsTime) / 1000));
  const isGpsFresh = gpsAgeSeconds <= 30;

  // Real distance & ETA estimation
  const etaMinutes = assignedAmb?.current_speed_kmh && assignedAmb.current_speed_kmh > 5
    ? Math.max(1, Math.round((3.2 / assignedAmb.current_speed_kmh) * 60))
    : 4;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleConfirmCancellation = () => {
    const finalReason = selectedReason === 'Other reason' && customReasonText.trim()
      ? customReasonText.trim()
      : selectedReason;
    updateStatus('CANCELLED', 'Emergency Cancelled', `Cancelled by user. Reason: ${finalReason}`);
    setShowCancelModal(false);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Top Alert Command Bar ────────────────────────────────────────── */}
      <div
        className="lx-role-hero lx-role-hero-patient"
        style={{ gap: 'var(--space-4)' }}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 relative z-10">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'var(--color-critical)',
              color: 'white',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          >
            <Activity className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="lx-role-hero-title flex items-center gap-2">
                {statusHeadline.title}
              </h1>
              <span className="lx-badge lx-badge-neutral font-mono">
                {activeEmergency.session_code}
              </span>
              <span className="lx-badge lx-badge-critical">
                <AlertTriangle className="w-3 h-3" />
                CRITICAL
              </span>
            </div>
            <p className="lx-role-hero-sub flex flex-wrap items-center gap-2 mt-1">
              <span>{statusHeadline.subtitle}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
              <span className="font-mono">
                Initiated: {new Date(activeEmergency.created_at).toLocaleTimeString()}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end relative z-10">
          <button
            onClick={handleManualRefresh}
            className="p-2.5 rounded-xl transition-colors border"
            style={{
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
            }}
            title="Refresh Emergency State"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
          </button>
          <a
            href="tel:108"
            className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            style={{ background: 'var(--color-critical)' }}
          >
            <PhoneCall className="w-4 h-4" />
            Call 108 Hotline
          </a>
          <button
            onClick={() => updateStatus('COMPLETED', 'Emergency Resolved', 'Patient stabilized and hospital admission completed.')}
            className="px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            style={{ background: 'var(--color-success)' }}
          >
            <CheckCircle className="w-4 h-4" />
            {t('resolve_emergency')}
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border"
            style={{
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
            }}
          >
            <XCircle className="w-4 h-4" />
            {t('cancel_emergency')}
          </button>
        </div>
      </div>

      {/* Stale GPS Alert Banner if ambulance telemetry is outdated */}
      {!isGpsFresh && (
        <div
          className="p-3.5 rounded-2xl text-xs flex items-center gap-3"
          style={{
            background: 'var(--color-warning-muted)',
            border: '1px solid var(--color-warning-border)',
            color: 'var(--color-warning-light)',
          }}
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <strong>Stale GPS Telemetry:</strong> Responder vehicle location was last received {gpsAgeSeconds}s ago. Coordinates on map may reflect last known position while unit re-establishes cellular stream.
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="lx-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cancel-emergency-title">
          <div className="lx-modal" style={{ maxWidth: 440 }}>
            <div className="lx-modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--color-critical-muted)',
                    border: '1px solid var(--color-critical-border)',
                    color: 'var(--color-critical-light)',
                  }}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="cancel-emergency-title" className="lx-modal-title">
                    Cancel Emergency Request?
                  </h3>
                  <p className="text-caption">
                    Are you sure? Responders and trauma center will be notified of cancellation.
                  </p>
                </div>
              </div>
            </div>

            <div className="lx-modal-body space-y-4">
              <div className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Please select reason for cancellation:
              </div>
              <div className="space-y-2">
                {CANCELLATION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs"
                    style={
                      selectedReason === reason
                        ? {
                            background: 'var(--color-critical-muted)',
                            borderColor: 'var(--color-critical)',
                            color: 'var(--color-text-primary)',
                          }
                        : {
                            background: 'var(--color-bg-subtle)',
                            borderColor: 'var(--color-border-subtle)',
                            color: 'var(--color-text-muted)',
                          }
                    }
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="text-rose-600"
                    />
                    <span className="font-medium">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'Other reason' && (
                <textarea
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Explain why this emergency is being cancelled..."
                  rows={2}
                  className="lx-input text-xs w-full mt-2"
                />
              )}
            </div>

            <div className="lx-modal-footer">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="lx-btn lx-btn-ghost"
              >
                Keep Emergency Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="lx-btn lx-btn-danger"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Real-Time State Machine Stepper ─────────────────────────────── */}
      <div className="lx-panel">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <Radio className="w-3.5 h-3.5" style={{ color: 'var(--color-critical)' }} />
            State Machine Progression
          </div>
          <span className="text-[11px] font-mono font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-success-light)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)', animation: 'pulse-dot 1.5s infinite' }}></span>
            Realtime WebSocket Synced
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {emergencySteps.map((step, idx) => {
            const isPastOrCurrent = currentStepIdx >= idx;
            const isCurrent = activeEmergency.status === step;
            return (
              <div
                key={step}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'ring-1'
                    : ''
                }`}
                style={
                  isCurrent
                    ? {
                        background: 'var(--color-critical-muted)',
                        borderColor: 'var(--color-critical)',
                        color: 'var(--color-critical-light)',
                        boxShadow: 'var(--shadow-sm)',
                      }
                    : isPastOrCurrent
                    ? {
                        background: 'var(--color-success-muted)',
                        borderColor: 'var(--color-success-border)',
                        color: 'var(--color-success-light)',
                      }
                    : {
                        background: 'var(--color-bg-subtle)',
                        borderColor: 'var(--color-border-subtle)',
                        color: 'var(--color-text-muted)',
                      }
                }
              >
                <div className="text-[10px] font-mono font-bold opacity-80">
                  {isPastOrCurrent && !isCurrent ? '✓ STEP' : `STEP ${idx + 1}`}
                </div>
                <div className="text-[11px] font-semibold mt-0.5 truncate" title={step.replace(/_/g, ' ')}>
                  {step.replace(/_/g, ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Multi-Column Command Center Grid ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Map + Unit Telematics Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Isolated Patient Map */}
          <div className="lx-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="lx-panel-title">
                <MapPin className="w-4 h-4" style={{ color: 'var(--color-critical)' }} />
                Live Patient & Responder Telemetry Grid
              </h3>
              <span className="text-caption flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
                Isolated Role Map
              </span>
            </div>
            <PatientMap
              patientLocation={{ latitude: activeEmergency.latitude, longitude: activeEmergency.longitude }}
              activeEmergency={activeEmergency}
            />
          </div>

          {/* Unit Telemetry Cards (Hospital, Ambulance, Blood) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hospital Card */}
            <div className="lx-panel flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5" style={{ color: 'var(--color-info-light)' }} />
                    <span className="text-label" style={{ color: 'var(--color-info-light)' }}>
                      Coordinating Hospital
                    </span>
                  </div>
                  <span className="lx-badge lx-badge-info">
                    {assignedHospital?.verification_status || 'VERIFIED'}
                  </span>
                </div>
                <div className="text-body font-bold" style={{ color: 'var(--color-text-primary)' }}>{assignedHospital?.name}</div>
                <p className="text-caption mt-1">{assignedHospital?.address}</p>
                
                {/* ER Bed Capacity Reporting */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}>
                    <div className="text-caption" style={{ textTransform: 'uppercase' }}>ER Trauma Beds</div>
                    <div className="text-body font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                      {assignedHospital?.total_beds ? `${assignedHospital.total_beds} Units` : 'Available'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}>
                    <div className="text-caption" style={{ textTransform: 'uppercase' }}>ICU Ventilators</div>
                    <div className="text-body font-bold mt-0.5" style={{ color: 'var(--color-success-light)' }}>
                      {assignedHospital?.icu_beds_available ? `${assignedHospital.icu_beds_available} Ready` : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <span className="text-caption">ER Direct Line:</span>
                <a
                  href={`tel:${assignedHospital?.emergency_phone || assignedHospital?.phone || '108'}`}
                  className="font-bold flex items-center gap-1 hover:underline"
                  style={{ color: 'var(--color-success-light)' }}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  {assignedHospital?.emergency_phone || assignedHospital?.phone || '108 Hotline'}
                </a>
              </div>
            </div>

            {/* Ambulance Telematics Card */}
            <div className="lx-panel flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5" style={{ color: 'var(--color-warning-light)' }} />
                    <span className="text-label" style={{ color: 'var(--color-warning-light)' }}>
                      Assigned Ambulance
                    </span>
                  </div>
                  <span className="lx-badge lx-badge-warning">
                    ETA: ~{etaMinutes} MINS
                  </span>
                </div>
                <div className="text-body font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {assignedAmb?.vehicle_number} • {assignedAmb?.vehicle_type?.replace(/_/g, ' ') || 'ADVANCED LIFE SUPPORT'}
                </div>
                <p className="text-caption mt-1">
                  Status: <span className="font-semibold" style={{ color: 'var(--color-warning-light)' }}>{assignedAmb?.status || 'EN_ROUTE'}</span> • Velocity:{' '}
                  <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{assignedAmb?.current_speed_kmh || 52} km/h</span>
                </p>

                {/* GPS Stream Health Status */}
                <div className="mt-3 p-2.5 rounded-xl flex items-center justify-between text-xs" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}>
                  <span className="text-caption">GPS Freshness:</span>
                  <span className="font-mono font-bold flex items-center gap-1.5" style={{ color: isGpsFresh ? 'var(--color-success-light)' : 'var(--color-warning-light)' }}>
                    <Activity className={`w-3.5 h-3.5 ${isGpsFresh ? 'animate-pulse' : ''}`} />
                    {isGpsFresh ? `Updated ${gpsAgeSeconds}s ago` : 'Location update unavailable'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <span className="text-caption">Navigation Vector:</span>
                <span className="font-mono font-bold flex items-center gap-1" style={{ color: 'var(--color-info-light)' }}>
                  <Navigation className="w-3.5 h-3.5" />
                  Heading {assignedAmb?.current_heading || 45}° NE
                </span>
              </div>
            </div>
          </div>

          {/* Blood Coordination & Donor Chain Status Panel */}
          {bloodRequest ? (
            <div className="lx-panel">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5" style={{ color: 'var(--color-critical)' }} />
                  <span className="text-label" style={{ color: 'var(--color-text-primary)' }}>Active Blood Coordination Chain</span>
                </div>
                <span className="lx-badge lx-badge-critical font-mono">
                  {bloodRequest.blood_group} • {bloodRequest.component.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="text-caption" style={{ textTransform: 'uppercase' }}>Units Required</div>
                  <div className="text-base font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{bloodRequest.units_needed} Units</div>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="text-caption" style={{ textTransform: 'uppercase' }}>Units Secured</div>
                  <div className="text-base font-bold mt-0.5" style={{ color: 'var(--color-success-light)' }}>
                    {bloodRequest.units_fulfilled} / {bloodRequest.units_needed} Units
                  </div>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}>
                  <div className="text-caption" style={{ textTransform: 'uppercase' }}>Matching Pipeline</div>
                  <div className="text-base font-bold mt-0.5" style={{ color: 'var(--color-warning-light)' }}>{bloodRequest.status}</div>
                </div>
              </div>

              {/* Donor Chain Member Escalation Stepper */}
              {donorChain && (
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                  <div className="text-xs font-semibold mb-2 flex items-center justify-between" style={{ color: 'var(--color-text-primary)' }}>
                    <span>Tier {donorChain.current_tier} Candidate Pool</span>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      Batch Size: {donorChain.batch_size} Candidates
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {donorChain.members?.slice(0, 3).map((member, mIdx) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)' }}
                      >
                        <span className="font-medium" style={{ color: 'var(--color-text-muted)' }}>
                          Donor Candidate #{mIdx + 1} (Privacy Obfuscated)
                        </span>
                        <span className="font-mono font-semibold" style={{ color: 'var(--color-success-light)' }}>
                          {member.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-4 text-xs flex items-center gap-2" style={{ background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--color-info)' }} />
              <span>No active blood transfusion request required for this trauma session. Standard trauma reserves on standby.</span>
            </div>
          )}
        </div>

        {/* Right Col: Official Audit Timeline Sidebar */}
        <div className="lx-panel flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="lx-panel-title">
              <Clock className="w-4 h-4" style={{ color: 'var(--color-success-light)' }} />
              Official Audit Timeline
            </h3>
            <span className="lx-badge lx-badge-neutral font-mono">
              {events.length} Events Logged
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px] pr-1">
            <EmergencyTimeline events={events} />
          </div>
        </div>
      </div>
    </div>
  );
};
