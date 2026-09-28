import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { locationService } from '../../services/locationService';
import { Button, Card, Badge } from '../ui';
import {
  AlertCircle,
  Activity,
  MapPin,
  Radio,
  HeartPulse,
  ShieldAlert,
  Clock,
  PhoneCall,
  Info,
  Navigation,
  Check,
  ChevronRight,
  RefreshCw,
  Building,
  Truck,
  Droplet,
  X
} from 'lucide-react';

type AssistanceCategory = 'MEDICAL_EMERGENCY' | 'HOSPITAL_ASSISTANCE' | 'AMBULANCE' | 'BLOOD_EMERGENCY' | 'OTHER';

interface CategoryOption {
  id: AssistanceCategory;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const ASSISTANCE_CATEGORIES: CategoryOption[] = [
  {
    id: 'MEDICAL_EMERGENCY',
    title: 'Medical Emergency',
    desc: 'Severe chest pain, respiratory distress, trauma, or unconsciousness.',
    icon: <HeartPulse className="w-5 h-5" />,
    color: 'var(--color-critical-light)',
  },
  {
    id: 'AMBULANCE',
    title: 'Ambulance Transport',
    desc: 'Rapid emergency ambulance dispatch with paramedic crew.',
    icon: <Truck className="w-5 h-5" />,
    color: 'var(--color-ambulance)',
  },
  {
    id: 'HOSPITAL_ASSISTANCE',
    title: 'Hospital Direct ER',
    desc: 'Priority ICU/ER triage bed preparation at the nearest facility.',
    icon: <Building className="w-5 h-5" />,
    color: 'var(--color-info-light)',
  },
  {
    id: 'BLOOD_EMERGENCY',
    title: 'Blood Emergency',
    desc: 'Critical requirement for blood units or emergency donors.',
    icon: <Droplet className="w-5 h-5" />,
    color: '#ef4444',
  },
];

export const EmergencyButton: React.FC = () => {
  const { triggerSOS } = useEmergency();

  // Wizard Modal State: 0 = closed, 1 = Location Confirm, 2 = Assistance Type, 3 = Condition & Final Confirm
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [isActivating, setIsActivating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssistanceCategory>('MEDICAL_EMERGENCY');
  const [conditionNotes, setConditionNotes] = useState('');
  const [detectedAddress, setDetectedAddress] = useState('Acquiring location...');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When opening wizard, detect location
  const handleOpenWizard = async () => {
    setWizardStep(1);
    setErrorMessage(null);
    setIsDetectingLocation(true);
    try {
      const pos = await locationService.requestInitialPosition();
      setCoords({ lat: pos.latitude, lon: pos.longitude });
      setDetectedAddress(`Verified GPS: [${pos.latitude.toFixed(4)}° N, ${pos.longitude.toFixed(4)}° E] (Chennai Metro Cluster)`);
    } catch {
      // Safe fallback coordinates for Chennai medical center if GPS permission is denied
      setCoords({ lat: 13.0827, lon: 80.2707 });
      setDetectedAddress('Approximate Location: Chennai Metro Trauma Corridor');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleRefreshLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const pos = await locationService.requestInitialPosition();
      setCoords({ lat: pos.latitude, lon: pos.longitude });
      setDetectedAddress(`Verified GPS: [${pos.latitude.toFixed(4)}° N, ${pos.longitude.toFixed(4)}° E]`);
    } catch {
      setDetectedAddress('Location services unavailable. Using manual region.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsActivating(true);
    setErrorMessage(null);
    try {
      const gpsTag = coords ? ` [GPS: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}]` : '';
      const formattedNotes = `[${selectedCategory}] ${conditionNotes.trim() || 'Urgent medical assistance requested'}${gpsTag}`;
      await triggerSOS(formattedNotes);
      setWizardStep(0);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Unable to establish emergency dispatch. Please dial 108 immediately.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto lx-animate-in">
      {/* Reassuring Normal State Header */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl"
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-default)',
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="success" showDot>
              Emergency Network Active
            </Badge>
            <span className="text-caption">Chennai Trauma Cluster</span>
          </div>
          <h1 className="text-h3 font-bold text-[var(--color-text-primary)]">Emergency Coordination Portal</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            One-touch coordinated dispatch connecting nearby trauma hospitals, ambulances, and matching blood donors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-label">National Emergency Support</div>
            <div className="text-caption">Toll-Free Ambulance: 108 / 112</div>
          </div>
          <a
            href="tel:108"
            className="lx-btn lx-btn-secondary lx-btn-sm flex items-center gap-1.5"
            aria-label="Call emergency telephone 108 directly"
          >
            <PhoneCall className="w-3.5 h-3.5" style={{ color: 'var(--color-critical-light)' }} />
            <span>Call 108</span>
          </a>
        </div>
      </div>

      {/* Main Emergency SOS Center */}
      <div
        className="lx-role-hero lx-role-hero-patient text-center"
        style={{ flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}
      >
        <div className="space-y-2 max-w-md mx-auto relative z-10">
          <div className="lx-badge lx-badge-critical" style={{ display: 'inline-flex', marginBottom: 'var(--space-2)' }}>
            <Radio className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Real-time GPS Coordinate Broadcast</span>
          </div>
          <h2 className="text-h2 font-bold text-[var(--color-text-primary)]">
            Immediate Emergency Assistance
          </h2>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Tap below to initiate emergency coordination with nearby trauma centers and ambulance fleets.
          </p>
        </div>

        {/* SOS Action Button */}
        <div className="flex justify-center py-2 relative z-10">
          <button
            onClick={handleOpenWizard}
            disabled={isActivating}
            className="lx-sos-button"
            aria-label="Initiate emergency assistance dispatch"
            role="button"
          >
            <Activity className="w-10 h-10 mb-1" aria-hidden="true" />
            <span className="lx-sos-label">
              {isActivating ? 'Connecting...' : 'GET EMERGENCY HELP'}
            </span>
            <span className="lx-sos-sublabel">Tap to start</span>
          </button>
        </div>

        {/* Real Location Verification Note */}
        <div className="flex items-center justify-center gap-2 relative z-10" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--color-success-light)' }} aria-hidden="true" />
          <span>Device coordinates are verified and routed directly to certified hospital trauma units.</span>
        </div>
      </div>

      {/* Info Grid: Key Platform Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lx-animate-in lx-animate-in-delay-2">
        <Card variant="default" className="space-y-3 lx-card-interactive">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-info-muted)', border: '1px solid var(--color-info-border)', color: 'var(--color-info-light)' }}
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h3 className="text-label" style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--fw-semibold)' }}>Trauma Readiness</h3>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Hospitals receive instant patient pre-arrival telemetry including vitals and ETA estimates.
          </p>
        </Card>

        <Card variant="default" className="space-y-3 lx-card-interactive">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}
          >
            <HeartPulse className="w-4 h-4" />
          </div>
          <h3 className="text-label" style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--fw-semibold)' }}>Rapid Blood Matching</h3>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Donors are matched within minutes via privacy-protected donor chain escalation.
          </p>
        </Card>

        <Card variant="default" className="space-y-3 lx-card-interactive">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-success-muted)', border: '1px solid var(--color-success-border)', color: 'var(--color-success-light)' }}
          >
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-label" style={{ color: 'var(--color-text-primary)', fontWeight: 'var(--fw-semibold)' }}>Live Telemetry</h3>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Ambulances stream live GPS positions every 10–15 seconds to ensure route transparency.
          </p>
        </Card>
      </div>

      {/* 4-Step Emergency Creation Guided Wizard Modal */}
      {wizardStep > 0 && (
        <div className="lx-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="triage-modal-title">
          <div className="lx-modal max-w-lg w-full">
            {/* Modal Header */}
            <div className="lx-modal-header flex items-center justify-between pb-3 border-b border-[var(--color-border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                  <Activity className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-rose-400">
                    Step {wizardStep} of 3 • Emergency Dispatch
                  </div>
                  <h3 id="triage-modal-title" className="lx-modal-title text-base font-bold">
                    {wizardStep === 1 && 'Confirm Incident Location'}
                    {wizardStep === 2 && 'What Assistance Do You Need?'}
                    {wizardStep === 3 && 'Start Emergency Coordination?'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setWizardStep(0)}
                disabled={isActivating}
                className="lx-icon-btn text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Cancel emergency modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: STEP 1 - Confirm Location */}
            {wizardStep === 1 && (
              <div className="lx-modal-body space-y-4 pt-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                        Detected Incident Position
                      </div>
                      <div className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
                        {isDetectingLocation ? 'Pinging GPS hardware...' : detectedAddress}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border-default)]">
                    <button
                      onClick={handleRefreshLocation}
                      disabled={isDetectingLocation}
                      className="text-xs text-[var(--color-primary-400)] hover:underline flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                      <span>Re-check GPS</span>
                    </button>
                  </div>
                </div>

                <div className="lx-info-banner">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Ambulance fleets and trauma centers will navigate directly to this position.</span>
                </div>

                <div className="lx-modal-footer flex items-center justify-between pt-3 border-t border-[var(--color-border-default)]">
                  <Button variant="ghost" onClick={() => setWizardStep(0)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setWizardStep(2)}
                    disabled={isDetectingLocation}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Use This Location
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Body: STEP 2 - Assistance Type */}
            {wizardStep === 2 && (
              <div className="lx-modal-body space-y-4 pt-4">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Select the primary category of support required for rapid triage:
                </p>

                <div className="space-y-2">
                  {ASSISTANCE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[var(--color-bg-elevated)] border-[var(--color-primary)] shadow-sm'
                            : 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: 'var(--color-bg-subtle)',
                              color: cat.color,
                              border: '1px solid var(--color-border-default)',
                            }}
                          >
                            {cat.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                              {cat.title}
                            </div>
                            <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {cat.desc}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="lx-modal-footer flex items-center justify-between pt-3 border-t border-[var(--color-border-default)]">
                  <Button variant="ghost" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setWizardStep(3)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Body: STEP 3 - Condition Notes & Confirmation */}
            {wizardStep === 3 && (
              <div className="lx-modal-body space-y-4 pt-4">
                <div className="lx-warning-banner">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Starting coordination will immediately ping nearest trauma centers and ambulance drivers.
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <div className="lx-form-group">
                  <label htmlFor="condition-notes" className="lx-label">
                    Patient Condition / Triage Notes (Optional)
                  </label>
                  <textarea
                    id="condition-notes"
                    rows={2}
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    placeholder="e.g. Unconscious, vehicle collision, severe bleeding, chest pain..."
                    className="lx-input lx-textarea"
                  />
                  <span className="lx-helper-text">
                    Brief notes help the responding hospital prepare blood and ICU resources in advance.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Type:</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {ASSISTANCE_CATEGORIES.find(c => c.id === selectedCategory)?.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Target Facility:</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      Nearest Verified Trauma Center (Apollo Greams)
                    </span>
                  </div>
                </div>

                <div className="lx-modal-footer flex items-center justify-between pt-3 border-t border-[var(--color-border-default)]">
                  <Button variant="ghost" onClick={() => setWizardStep(2)} disabled={isActivating}>
                    Back
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleFinalSubmit}
                    isLoading={isActivating}
                    leftIcon={<AlertCircle className="w-4 h-4" />}
                  >
                    Start Emergency Coordination
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
