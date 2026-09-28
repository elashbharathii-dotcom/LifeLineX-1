import React, { useState } from 'react';
import {
  Radio,
  AlertCircle,
  Phone,
  ArrowRight,
  Sun,
  Moon,
  Lock,
  Loader2,
  Sparkles,
  Building,
  Droplet,
  Truck,
  User,
  CheckCircle2,
  Mail,
  Key,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { OtpVerificationModal } from './OtpVerificationModal';

type AuthScreenMode = 'REGISTER_ENTRY' | 'PATIENT_SIGN_IN' | 'INSTITUTIONAL_LOGIN';

export const AuthScreen: React.FC = () => {
  const {
    signInWithGoogle,
    sendPhoneOtp,
    loginWithInstitutionalCredentials,
    loginWithDeveloperSandbox,
  } = useAuth();
  const { theme, toggleTheme } = useThemeLanguage();

  const [mode, setMode] = useState<AuthScreenMode>('REGISTER_ENTRY');

  // Patient Phone OTP State
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Institutional Login State
  const [instCategory, setInstCategory] = useState<'HOSPITAL' | 'BLOOD_BANK' | 'AMBULANCE' | null>(null);
  const [instIdentifier, setInstIdentifier] = useState('');
  const [instPassword, setInstPassword] = useState('');
  const [isSubmittingInst, setIsSubmittingInst] = useState(false);

  // Common Feedback & Sandbox
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, _setSuccessMessage] = useState<string | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoadingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in could not be completed. Please try again.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Phone OTP Submit Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNum = phoneNumber.replace(/[\s-]/g, '');
    if (cleanNum.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = `${countryCode}${cleanNum}`;
    setIsSendingOtp(true);

    try {
      const { error } = await sendPhoneOtp(fullPhone);
      if (error) {
        setErrorMessage(error);
      } else {
        setShowOtpModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to send verification code. Please check your number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Institutional Sign-In Handler
  const handleInstitutionalSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!instIdentifier.trim()) {
      setErrorMessage('Please enter your institutional email or registered mobile number.');
      return;
    }

    setIsSubmittingInst(true);
    try {
      const result = await loginWithInstitutionalCredentials(instIdentifier.trim(), instPassword);
      if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate institutional credentials.');
    } finally {
      setIsSubmittingInst(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 transition-colors${theme === 'light' ? ' theme-light' : ''}`}
      style={{
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Top Utility Header */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-primary)', color: 'white' }}
            aria-hidden="true"
          >
            <Radio className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>
            Lifeline<span style={{ color: 'var(--color-primary)' }}>X</span> Identity Network
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mode !== 'REGISTER_ENTRY' && (
            <button
              onClick={() => {
                setErrorMessage(null);
                setMode('REGISTER_ENTRY');
              }}
              className="text-xs font-semibold hover:underline px-2 py-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
            >
              All Options
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="lx-icon-btn"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-xl mx-auto my-auto py-4">
        <div
          className="p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          {/* Subtle teal decorative glow */}
          <div
            style={{
              position: 'absolute',
              top: '-30%',
              right: '-20%',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--color-primary-muted) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="p-3.5 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed relative z-10 lx-animate-in"
              style={{
                background: 'var(--color-critical-muted)',
                border: '1px solid var(--color-critical-border)',
                color: 'var(--color-critical-light)',
              }}
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">
                  {errorMessage.includes('Institutional access required') ? 'Access Restriction' : 'Authentication Notice'}
                </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              className="p-3.5 rounded-2xl text-xs flex items-start gap-2.5 leading-relaxed relative z-10 lx-animate-in"
              style={{
                background: 'var(--color-success-muted)',
                border: '1px solid var(--color-success-border)',
                color: 'var(--color-success-light)',
              }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* VIEW 1: REGISTRATION ENTRY (Section 1 of UX Spec)                */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {mode === 'REGISTER_ENTRY' && (
            <div className="space-y-6 relative z-10 lx-animate-in">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-1 shadow-md" style={{ background: 'var(--color-primary)', color: 'white' }}>
                  <Radio className="w-6 h-6" aria-hidden="true" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  Create an Account
                </h1>
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  I'm using LifelineX as:
                </p>
              </div>

              {/* Role Cards List */}
              <div className="space-y-3">
                {/* 1. Patient Option (Freely selectable public registration) */}
                <div
                  className="p-4 rounded-2xl border transition-all"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-primary)',
                    boxShadow: '0 0 0 1px var(--color-primary-muted)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-400 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          👤 Patient
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          Create a personal LifelineX account.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        setMode('PATIENT_SIGN_IN');
                      }}
                      className="lx-btn lx-btn-primary lx-btn-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Create Patient Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t my-2" style={{ borderColor: 'var(--color-border-subtle)' }} />

                {/* 2. Hospital (Institutional - Controlled Access) */}
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400 shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          🏥 Hospital
                        </div>
                        <blockquote className="text-[11px] mt-1 italic leading-relaxed" style={{ color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-border-default)', paddingLeft: '8px' }}>
                          Institutional access requires authorized credentials.
                        </blockquote>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        setInstCategory('HOSPITAL');
                        setMode('INSTITUTIONAL_LOGIN');
                      }}
                      className="lx-btn lx-btn-secondary lx-btn-sm"
                    >
                      <Lock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span>Institutional Login</span>
                    </button>
                  </div>
                </div>

                {/* 3. Blood Bank (Institutional - Controlled Access) */}
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/20 text-rose-400 shrink-0">
                        <Droplet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          🩸 Blood Bank
                        </div>
                        <blockquote className="text-[11px] mt-1 italic leading-relaxed" style={{ color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-border-default)', paddingLeft: '8px' }}>
                          Institutional access requires authorized credentials.
                        </blockquote>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        setInstCategory('BLOOD_BANK');
                        setMode('INSTITUTIONAL_LOGIN');
                      }}
                      className="lx-btn lx-btn-secondary lx-btn-sm"
                    >
                      <Lock className="w-3 h-3 text-rose-500" />
                      <span>Institutional Login</span>
                    </button>
                  </div>
                </div>

                {/* 4. Ambulance (Institutional - Controlled Access) */}
                <div
                  className="p-4 rounded-2xl border"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-subtle)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400 shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          🚑 Ambulance
                        </div>
                        <blockquote className="text-[11px] mt-1 italic leading-relaxed" style={{ color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-border-default)', paddingLeft: '8px' }}>
                          Institutional access requires authorized credentials.
                        </blockquote>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setErrorMessage(null);
                        setInstCategory('AMBULANCE');
                        setMode('INSTITUTIONAL_LOGIN');
                      }}
                      className="lx-btn lx-btn-secondary lx-btn-sm"
                    >
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Institutional Login</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom: Existing Account? [Sign In] */}
              <div className="pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Existing Account?</span>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('PATIENT_SIGN_IN');
                  }}
                  className="font-bold hover:underline cursor-pointer"
                  style={{ color: 'var(--color-primary-light)' }}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* VIEW 2: PATIENT SIGN IN / REGISTER                                */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {mode === 'PATIENT_SIGN_IN' && (
            <div className="space-y-6 relative z-10 lx-animate-in">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('REGISTER_ENTRY');
                  }}
                  className="text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Account Types</span>
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                  CITIZEN ACCESS
                </span>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                  Patient Sign In &amp; Register
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Sign in with your mobile number or Google account.
                </p>
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoadingGoogle || isSendingOtp}
                className="lx-btn lx-btn-secondary w-full py-3"
              >
                {isLoadingGoogle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t w-full" style={{ borderColor: 'var(--color-border-subtle)' }} />
                <span className="text-[11px] font-bold uppercase tracking-wider px-3" style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' }}>
                  OR
                </span>
                <div className="border-t w-full" style={{ borderColor: 'var(--color-border-subtle)' }} />
              </div>

              {/* Mobile Phone OTP */}
              <form onSubmit={handleSendOtp} className="space-y-3.5">
                <label htmlFor="patient-phone" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Mobile Phone Number
                </label>
                <div className="flex items-center rounded-2xl overflow-hidden border focus-within:ring-2" style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}>
                  <div className="px-3 py-2.5 border-r flex items-center" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-transparent text-xs font-bold font-mono focus:outline-none cursor-pointer"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                  </div>
                  <div className="flex-1 flex items-center px-3">
                    <Phone className="w-3.5 h-3.5 mr-2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      id="patient-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                      placeholder="98765 43210"
                      disabled={isSendingOtp}
                      className="w-full bg-transparent py-2.5 text-xs font-mono font-medium focus:outline-none"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp || phoneNumber.replace(/\D/g, '').length < 10}
                  className="lx-btn lx-btn-primary w-full py-3"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP…</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t text-center text-xs" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('INSTITUTIONAL_LOGIN');
                  }}
                  className="hover:underline text-[11px] cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Hospital, Blood Bank, or EMS staff? <strong>Institutional Login</strong>
                </button>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* VIEW 3: INSTITUTIONAL LOGIN (Section 3 & 10 of UX Spec)           */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {mode === 'INSTITUTIONAL_LOGIN' && (
            <div className="space-y-6 relative z-10 lx-animate-in">
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('REGISTER_ENTRY');
                  }}
                  className="text-xs font-medium flex items-center gap-1 hover:underline cursor-pointer"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Account Types</span>
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  CONTROLLED ACCESS
                </span>
              </div>

              <div className="text-center space-y-1">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-1 shadow-md border ${
                  instCategory === 'BLOOD_BANK'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : instCategory === 'AMBULANCE'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-blue-400 border-slate-700'
                }`}>
                  {instCategory === 'BLOOD_BANK' ? (
                    <Droplet className="w-6 h-6" />
                  ) : instCategory === 'AMBULANCE' ? (
                    <Truck className="w-6 h-6" />
                  ) : (
                    <Building className="w-6 h-6" />
                  )}
                </div>
                <h2 className="text-xl font-black" style={{ color: 'var(--color-text-primary)' }}>
                  {instCategory === 'BLOOD_BANK'
                    ? 'Blood Bank Center Access'
                    : instCategory === 'AMBULANCE'
                    ? 'Ambulance & EMS Dispatch Access'
                    : 'Institutional Access'}
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {instCategory === 'BLOOD_BANK'
                    ? 'Sign in with your authorized blood bank facility credentials.'
                    : instCategory === 'AMBULANCE'
                    ? 'Sign in with your registered emergency vehicle pilot credentials.'
                    : 'Sign in using your provisioned LifelineX account.'}
                </p>
              </div>

              {/* Institutional Form */}
              <form onSubmit={handleInstitutionalSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="inst-id" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Email / Phone
                  </label>
                  <div className="flex items-center rounded-2xl border px-3" style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}>
                    <Mail className="w-4 h-4 mr-2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      id="inst-id"
                      type="text"
                      value={instIdentifier}
                      onChange={(e) => setInstIdentifier(e.target.value)}
                      placeholder={
                        instCategory === 'BLOOD_BANK'
                          ? 'bloodbank.director@redcross.org or phone'
                          : instCategory === 'AMBULANCE'
                          ? 'ambulance.driver1@medifleet.org or phone'
                          : 'admin@hospital.health or +91 94440...'
                      }
                      className="w-full bg-transparent py-2.5 text-xs focus:outline-none"
                      style={{ color: 'var(--color-text-primary)' }}
                      disabled={isSubmittingInst}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="inst-pwd" className="block text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Password reset links must be authorized by your organization administrator.')}
                      className="text-[11px] hover:underline cursor-pointer"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex items-center rounded-2xl border px-3" style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-default)' }}>
                    <Key className="w-4 h-4 mr-2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      id="inst-pwd"
                      type="password"
                      value={instPassword}
                      onChange={(e) => setInstPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent py-2.5 text-xs focus:outline-none font-mono"
                      style={{ color: 'var(--color-text-primary)' }}
                      disabled={isSubmittingInst}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingInst || !instIdentifier.trim()}
                  className="lx-btn lx-btn-primary w-full py-3"
                >
                  {isSubmittingInst ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Institutional Credentials…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Informational Box */}
              <div
                className="p-3.5 rounded-2xl text-xs leading-relaxed space-y-1"
                style={{
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Don't have institutional access?
                </div>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  Contact your organization administrator for authorized credentials.
                </p>
              </div>
            </div>
          )}

          {/* Developer Sandbox Drawer (for testing) */}
          {(import.meta.env.DEV || !import.meta.env.PROD) && (
            <div className="pt-4 border-t flex flex-col items-center gap-2 relative z-10" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <button
                onClick={() => setShowSandbox(!showSandbox)}
                className="text-[11px] font-mono hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Developer Test Sandbox</span>
                <span>{showSandbox ? '▲' : '▼'}</span>
              </button>

              {showSandbox && (
                <div
                  className="w-full p-4 rounded-2xl space-y-3 lx-animate-in border text-xs"
                  style={{
                    background: 'var(--color-bg-subtle)',
                    borderColor: 'var(--color-border-default)',
                  }}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Quick Login as Seeded Persona:</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      TESTING ONLY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => loginWithDeveloperSandbox('11111111-1111-1111-1111-111111111101', 'PATIENT')}
                      className="p-2.5 rounded-xl border text-left hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}
                    >
                      <User className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-bold">Rahul Sharma</div>
                        <div className="text-[10px] opacity-75">Patient Mode</div>
                      </div>
                    </button>

                    <button
                      onClick={() => loginWithDeveloperSandbox('11111111-1111-1111-1111-111111111102', 'DONOR')}
                      className="p-2.5 rounded-xl border text-left hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}
                    >
                      <Droplet className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-bold">Priya Sundaram</div>
                        <div className="text-[10px] opacity-75">Universal Donor (O+)</div>
                      </div>
                    </button>

                    <button
                      onClick={() => loginWithDeveloperSandbox('11111111-1111-1111-1111-111111111105', 'HOSPITAL_ADMIN')}
                      className="p-2.5 rounded-xl border text-left hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}
                    >
                      <Building className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="font-bold">Dr. Arvind Swaminathan</div>
                        <div className="text-[10px] opacity-75">Hospital Admin (Apollo)</div>
                      </div>
                    </button>

                    <button
                      onClick={() => loginWithDeveloperSandbox('11111111-1111-1111-1111-111111111107', 'AMBULANCE_DRIVER')}
                      className="p-2.5 rounded-xl border text-left hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}
                    >
                      <Truck className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">Murugan Velu</div>
                        <div className="text-[10px] opacity-75">Ambulance Pilot (108 ALS)</div>
                      </div>
                    </button>

                    <button
                      onClick={() => loginWithDeveloperSandbox('11111111-1111-1111-1111-111111111106', 'BLOOD_BANK_ADMIN')}
                      className="p-2.5 rounded-xl border text-left hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
                      style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-subtle)' }}
                    >
                      <Droplet className="w-4 h-4 text-red-500" />
                      <div>
                        <div className="font-bold">Dr. Meenakshi Raman</div>
                        <div className="text-[10px] opacity-75">Blood Bank Director (Red Cross)</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OtpVerificationModal
          phone={`${countryCode} ${phoneNumber}`}
          onSuccess={() => setShowOtpModal(false)}
          onClose={() => setShowOtpModal(false)}
        />
      )}

      {/* Bottom Footer */}
      <div className="w-full max-w-xl mx-auto text-center py-2 text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        LifelineX Emergency Healthcare Network.
      </div>
    </div>
  );
};
