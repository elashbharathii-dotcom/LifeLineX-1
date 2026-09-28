import React, { useState } from 'react';
import { User, Heart, Shield, AlertCircle, ArrowRight, ArrowLeft, Loader2, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { BloodGroupType } from '../../types/database';
import { supportedLanguages } from '../../i18n';

export const ProfileOnboardingScreen: React.FC = () => {
  const { completeOnboarding, signOut } = useAuth();
  const { theme } = useThemeLanguage();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [language, setLanguage] = useState('en');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [selectedRole, setSelectedRole] = useState<'PATIENT' | 'DONOR'>('PATIENT');
  const [bloodGroup, setBloodGroup] = useState<BloodGroupType>('O+');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full legal name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { error } = await completeOnboarding({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth || undefined,
        preferred_language: language,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        role: selectedRole,
        blood_group: selectedRole === 'DONOR' ? bloodGroup : undefined,
      });

      if (error) {
        setErrorMessage(error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete profile onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors${theme === 'light' ? ' theme-light' : ''}`}
      style={{
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div className="w-full max-w-lg">
        <div
          className="p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  Profile Setup
                </h1>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  LifelineX Patient &amp; Donor Network
                </p>
              </div>
            </div>

            {/* Stepper Indicators */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                  style={
                    step === s
                      ? {
                          background: 'var(--color-primary)',
                          color: 'white',
                          boxShadow: 'var(--shadow-sm)',
                        }
                      : step > s
                      ? {
                          background: 'var(--color-success-muted)',
                          color: 'var(--color-success-light)',
                          border: '1px solid var(--color-success-border)',
                        }
                      : {
                          background: 'var(--color-bg-subtle)',
                          color: 'var(--color-text-muted)',
                          border: '1px solid var(--color-border-subtle)',
                        }
                  }
                >
                  {step > s ? '✓' : s}
                </div>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="p-3 rounded-xl text-xs flex items-start gap-2"
              style={{
                background: 'var(--color-critical-muted)',
                border: '1px solid var(--color-critical-border)',
                color: 'var(--color-critical-light)',
              }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step Forms */}
          <form onSubmit={handleNext} className="space-y-4">
            {/* ── STEP 1: Basic Identity ────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4 lx-animate-in">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Personal Details
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Used by emergency dispatch and verified healthcare providers.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="full-name" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sundaram"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2"
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="dob" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Date of Birth
                    </label>
                    <input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2"
                      style={{
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="language" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Preferred Language
                    </label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2"
                      style={{
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {supportedLanguages.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Contact & Emergency ──────────────────────── */}
            {step === 2 && (
              <div className="space-y-4 lx-animate-in">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Emergency &amp; Contact
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Contacts notified automatically during SOS activations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="user-email" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Contact Email
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      style={{
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="user-phone" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Mobile Number
                    </label>
                    <input
                      id="user-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                      style={{
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <label htmlFor="emg-name" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Emergency Contact Name (Next of Kin)
                  </label>
                  <input
                    id="emg-name"
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g. Ramesh Sundaram (Spouse / Parent)"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="emg-phone" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Emergency Contact Phone
                  </label>
                  <input
                    id="emg-phone"
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 98765 11223"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                    style={{
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-default)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 3: Platform Capabilities & Donor Participation ───────────── */}
            {step === 3 && (
              <div className="space-y-4 lx-animate-in">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Account Capabilities
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Your LifelineX personal patient account is ready. You may also activate donor capabilities.
                  </p>
                </div>

                {/* Primary Account: Patient / Citizen (Fixed base identity) */}
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: 'var(--color-primary-muted)',
                    borderColor: 'var(--color-primary)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Citizen / Patient Account (Primary)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    Instant access to SOS emergency dispatch, live ambulance tracking, and regional hospital network navigation.
                  </p>
                </div>

                {/* Optional Universal Donor Capability */}
                <div
                  className="p-4 rounded-2xl border transition-all"
                  style={{
                    background: selectedRole === 'DONOR' ? 'var(--color-critical-muted)' : 'var(--color-bg-subtle)',
                    borderColor: selectedRole === 'DONOR' ? 'var(--color-critical-border)' : 'var(--color-border-subtle)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          Universal Donor Readiness (Optional)
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Enable voluntary participation in regional blood shortage donor chains.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedRole === 'DONOR'}
                        onChange={(e) => setSelectedRole(e.target.checked ? 'DONOR' : 'PATIENT')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  {selectedRole === 'DONOR' && (
                    <div className="mt-3 pt-3 border-t space-y-2 lx-animate-in" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <label htmlFor="blood-group-donor" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        Your Blood Group (Required for Donor Matching)
                      </label>
                      <select
                        id="blood-group-donor"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value as BloodGroupType)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold font-mono focus:outline-none"
                        style={{
                          background: 'var(--color-bg-base)',
                          border: '1px solid var(--color-border-default)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroupType[]).map((bg) => (
                          <option key={bg} value={bg}>
                            {bg} (Self-Declared)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        Clinical cross-matching and vitals screening will be performed prior to any blood donation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Security Note on Privileged Roles */}
                <div
                  className="p-3.5 rounded-2xl text-[11px] flex items-start gap-2.5 leading-relaxed"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Shield className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                  <div>
                    <strong style={{ color: 'var(--color-text-secondary)' }}>Looking for institutional access?</strong>
                    <p className="text-[11px] mt-0.5">
                      Hospital, Blood Bank, and Ambulance staff accounts require authorized institutional credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  className="lx-btn lx-btn-secondary lx-btn-sm flex items-center gap-1.5"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--color-text-muted)' }}
                  disabled={isSubmitting}
                >
                  Cancel &amp; Sign Out
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="lx-btn lx-btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Finalizing registration…</span>
                  </>
                ) : step === 3 ? (
                  <span>Complete Setup</span>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
