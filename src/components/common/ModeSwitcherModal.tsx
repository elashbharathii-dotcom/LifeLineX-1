import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRoleType } from '../../types/database';
import {
  User,
  Heart,
  Building,
  Droplet,
  Truck,
  Shield,
  Check,
  ArrowRight,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ModeOption {
  id: UserRoleType;
  title: string;
  badge?: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  isUniversal?: boolean;
}

const PRIMARY_MODES: ModeOption[] = [
  {
    id: 'PATIENT',
    title: 'Patient Mode',
    badge: 'Citizen Access',
    description: 'Get rapid emergency assistance, manage appointments, and track medical coordination.',
    icon: <User className="w-5 h-5" />,
    accentColor: 'var(--color-primary)',
  },
  {
    id: 'HOSPITAL_ADMIN',
    title: 'Hospital Command',
    badge: 'Clinical Staff',
    description: 'Triage active emergencies, coordinate incoming ambulances, and manage blood requirements.',
    icon: <Building className="w-5 h-5" />,
    accentColor: 'var(--color-info-light)',
  },
  {
    id: 'AMBULANCE_DRIVER',
    title: 'Ambulance Driver',
    badge: 'Transit Fleet',
    description: 'Receive emergency dispatch requests, stream live GPS telemetry, and navigate trips.',
    icon: <Truck className="w-5 h-5" />,
    accentColor: 'var(--color-ambulance)',
  },
  {
    id: 'BLOOD_BANK_ADMIN',
    title: 'Blood Bank Command',
    badge: 'Blood Center',
    description: 'Monitor component inventory, fulfill hospital requests, and organize donation drives.',
    icon: <Droplet className="w-5 h-5" />,
    accentColor: 'var(--color-critical-light)',
  },
];

const UNIVERSAL_DONOR_MODE: ModeOption = {
  id: 'DONOR',
  title: 'Universal Donor Mode',
  badge: 'Citizen Hero',
  description: 'Respond to nearby emergency blood requests. Any verified user can toggle donor readiness anytime.',
  icon: <Heart className="w-5 h-5" />,
  accentColor: 'var(--color-donor)',
  isUniversal: true,
};

interface ModeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModeSwitcherModal: React.FC<ModeSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { activeRole, switchRole, availableRoles, profile } = useAuth();
  const [accessWarning, setAccessWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRoleAuthorized = (role: UserRoleType): boolean => {
    if (role === 'DONOR') return true; // Universal capability
    if (availableRoles.includes(role)) return true;
    if (role === 'HOSPITAL_ADMIN' && availableRoles.includes('HOSPITAL_STAFF')) return true;
    if (role === 'BLOOD_BANK_ADMIN' && availableRoles.includes('BLOOD_BANK_STAFF')) return true;
    if (role === 'AMBULANCE_DRIVER' && availableRoles.includes('AMBULANCE_PROVIDER_ADMIN')) return true;
    if (availableRoles.includes('LIFELINEX_ADMIN') || availableRoles.includes('SUPER_ADMIN')) return true;
    return false;
  };

  const handleSelectMode = (role: UserRoleType) => {
    if (!isRoleAuthorized(role)) {
      setAccessWarning('This operational mode requires an authorized account for this role.');
      return;
    }
    setAccessWarning(null);
    switchRole(role);
    onClose();
  };

  const isDonorActive = activeRole === 'DONOR';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-switcher-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-[var(--color-border-default)] my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[var(--color-primary)] flex items-center justify-center border border-teal-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                Platform Capabilities
              </span>
              <h2 id="mode-switcher-title" className="text-xl font-black text-[var(--color-text-primary)]">
                Select Operational Mode
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Access Warning Notice */}
        {accessWarning && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{accessWarning}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="space-y-4 pt-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Universal Donor Mode Card */}
          <div
            onClick={() => handleSelectMode('DONOR')}
            className={`p-5 rounded-[24px] border-2 transition-all cursor-pointer relative ${
              isDonorActive
                ? 'bg-rose-50/60 border-rose-500 shadow-sm'
                : 'bg-white hover:bg-[#F7F8F6] border-rose-200 hover:border-rose-400'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[var(--color-text-primary)]">
                      {UNIVERSAL_DONOR_MODE.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      Citizen Hero
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    {UNIVERSAL_DONOR_MODE.description}
                  </p>
                </div>
              </div>

              {isDonorActive ? (
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="text-xs font-bold text-rose-600 flex items-center gap-1 shrink-0 pt-1">
                  <span>Enter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-[var(--color-border-default)] flex-1" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-text-muted)]">
              Authorized Institutional Roles
            </span>
            <div className="h-px bg-[var(--color-border-default)] flex-1" />
          </div>

          {/* Authorized Modes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PRIMARY_MODES.filter((mode) => isRoleAuthorized(mode.id)).map((mode) => {
              const isActive = activeRole === mode.id;

              return (
                <div
                  key={mode.id}
                  onClick={() => handleSelectMode(mode.id)}
                  className={`p-4 rounded-[22px] border transition-all text-left flex flex-col justify-between ${
                    isActive
                      ? 'bg-teal-50/60 border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] shadow-sm cursor-pointer'
                      : 'bg-white border-[var(--color-border-default)] hover:border-[var(--color-primary)] hover:bg-[#F7F8F6] cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[var(--color-text-primary)]">
                      {mode.icon}
                    </div>

                    {isActive ? (
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      mode.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7F8F6] text-[var(--color-text-secondary)]">
                          {mode.badge}
                        </span>
                      )
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-[var(--color-text-primary)]">
                      {mode.title}
                    </h4>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-[var(--color-border-default)] mt-5">
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 font-medium">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Active: {profile?.full_name || 'Citizen'} ({activeRole})</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
