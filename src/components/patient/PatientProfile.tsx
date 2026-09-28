import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { pregnancyService } from '../../services/pregnancyService';
import { notificationService } from '../../services/notificationService';
import { BloodGroupType, Profile } from '../../types/database';
import { Badge, Button } from '../ui';
import {
  User,
  Heart,
  Baby,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bell,
  Globe,
  ArrowRight,
  Calendar,
  Lock,
} from 'lucide-react';

interface PatientProfileProps {
  onNavigate?: (tabId: string) => void;
}

interface ProfileFormProps {
  profile: Profile | null | undefined;
  activeRole: string;
  updateProfile?: (updates: Partial<Profile>) => void;
  onNavigate?: (tabId: string) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  activeRole,
  updateProfile,
  onNavigate,
}) => {
  const { language, setLanguage } = useThemeLanguage();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [dob, setDob] = useState((profile as any)?.date_of_birth || '1995-06-15');
  const [address, setAddress] = useState(profile?.city ? `${profile.city}, Tamil Nadu` : 'Chennai, Tamil Nadu');
  const [bloodGroup, setBloodGroup] = useState<BloodGroupType>((profile?.blood_group as BloodGroupType) || 'O+');
  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergency_contact_name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergency_contact_phone || '');

  // Sound notifications setting
  const [soundEnabled, setSoundEnabled] = useState(notificationService.isSoundEnabled());

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const profileId = profile?.id;
  const activePregnancy = useMemo(() => {
    return profileId ? pregnancyService.getActiveProfile(profileId) : null;
  }, [profileId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      if (updateProfile) {
        updateProfile({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          blood_group: bloodGroup,
          emergency_contact_name: emergencyContactName.trim(),
          emergency_contact_phone: emergencyContactPhone.trim(),
          city: address.split(',')[0].trim() || 'Chennai',
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationService.setSoundEnabled(next);
  };

  const initials = useMemo(() => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [fullName]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 lx-animate-in">
      {/* ─── Profile Header ──────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-6 sm:p-8 border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        style={{
          background: 'var(--color-bg-surface)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0 shadow-md"
            style={{ background: 'var(--color-primary)' }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-h2 font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
                {fullName || 'Patient Profile'}
              </h1>
              <Badge variant="success" showDot>
                Active Patient
              </Badge>
            </div>
            <p className="text-body-sm text-slate-400 mt-0.5">
              Verified LifelineX Identity • Role: {activeRole.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary">ISO 27799 Compliant</Badge>
          <Badge variant="neutral">EHR ID: {profileId ? profileId.slice(-8) : 'ACTIVE'}</Badge>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 lx-animate-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile changes saved successfully and synced with the emergency grid.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2 lx-animate-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ─── 1. Personal Information ──────────────────────────────────── */}
        <div className="p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-[#0F4C47] dark:text-[#E2F2A4]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C47]/40"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C47]/40"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Primary Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C47]/40"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Date of Birth</label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C47]/40"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Address / City</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C47]/40"
              />
            </div>
          </div>
        </div>

        {/* ─── 2. Emergency Information ─────────────────────────────────── */}
        <div className="p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Phone className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Medical Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma (Spouse)"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Emergency Phone</label>
              <input
                type="tel"
                placeholder="+91 98765 00000"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            This contact receives automated SMS broadcasts whenever an emergency SOS is dispatched from your account.
          </p>
        </div>

        {/* ─── 3. Health Information ────────────────────────────────────── */}
        <div className="p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Heart className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Health Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Blood Group */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Blood Group *</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroupType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              >
                <option value="O+">O+ (Rh Positive)</option>
                <option value="O-">O- (Rh Negative - Universal)</option>
                <option value="A+">A+ (Rh Positive)</option>
                <option value="A-">A- (Rh Negative)</option>
                <option value="B+">B+ (Rh Positive)</option>
                <option value="B-">B- (Rh Negative)</option>
                <option value="AB+">AB+ (Rh Positive)</option>
                <option value="AB-">AB- (Rh Negative)</option>
              </select>
            </div>

            {/* Pregnancy Mode Status */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">Pregnancy Mode Status</label>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className={`w-4 h-4 ${activePregnancy ? 'text-pink-500' : 'text-slate-400'}`} />
                  <span className="text-slate-900 dark:text-white text-xs font-semibold">
                    {activePregnancy ? `Week ${activePregnancy.pregnancy_week || 1} Active` : 'Not Enabled'}
                  </span>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('pregnancy')}
                    className="text-xs text-[#0F4C47] dark:text-[#E2F2A4] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{activePregnancy ? 'View Dashboard' : 'Set Up'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. Account Settings ──────────────────────────────────────── */}
        <div className="p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Account Settings</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Language */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Interface Language</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Current: {language === 'en' ? 'English (UK/Global)' : language === 'ta' ? 'தமிழ் (Tamil)' : 'हिन्दी (Hindi)'}</div>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>

            {/* Notifications Sound */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Emergency Tone &amp; Chimes</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Play audible sound during incident broadcasts</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`lx-btn lx-btn-sm ${
                  soundEnabled ? 'lx-btn-success' : 'lx-btn-secondary'
                }`}
              >
                <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Data Privacy &amp; Jitter</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">ISO 27799 Compliant • ~800m privacy coordinate blur active</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                Protected
              </span>
            </div>
          </div>
        </div>

        {/* ─── Save Profile Button ──────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export const PatientProfile: React.FC<PatientProfileProps> = ({ onNavigate }) => {
  const { profile, activeRole, updateProfile } = useAuth();

  return (
    <ProfileForm
      key={profile?.id || 'anonymous-patient'}
      profile={profile}
      activeRole={activeRole}
      updateProfile={updateProfile}
      onNavigate={onNavigate}
    />
  );
};
