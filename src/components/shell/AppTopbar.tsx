import React, { useState } from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ModeSwitcherModal } from '../common/ModeSwitcherModal';
import { supportedLanguages, LanguageCode } from '../../i18n';
import { UserRoleType } from '../../types/database';
import {
  Menu,
  Bell,
  Volume2,
  VolumeX,
  Globe,
  Sun,
  Moon,
  Radio,
  LogOut,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';

import { NavItem } from '../../lib/navItems';

interface AppTopbarProps {
  pageTitle: string;
  unreadCount: number;
  activeTab?: string;
  navItems?: NavItem[];
  onTabChange?: (tabId: string) => void;
  onMenuToggle: () => void;
  onOpenNotifications: () => void;
}

const getRoleTitle = (role: UserRoleType): string => {
  switch (role) {
    case 'PATIENT': return 'Patient Mode';
    case 'DONOR': return 'Universal Donor';
    case 'HOSPITAL_ADMIN':
    case 'HOSPITAL_STAFF': return 'Hospital Command';
    case 'AMBULANCE_DRIVER': return 'Ambulance Driver';
    case 'AMBULANCE_PROVIDER_ADMIN': return 'Fleet Admin';
    case 'BLOOD_BANK_ADMIN':
    case 'BLOOD_BANK_STAFF': return 'Blood Bank';
    case 'LIFELINEX_ADMIN':
    case 'SUPER_ADMIN': return 'Platform Admin';
    default: return 'User';
  }
};

const getRoleColor = (role: UserRoleType): string => {
  switch (role) {
    case 'PATIENT': return 'var(--color-primary)';
    case 'DONOR': return '#c084fc';
    case 'HOSPITAL_ADMIN':
    case 'HOSPITAL_STAFF': return 'var(--color-info-light)';
    case 'AMBULANCE_DRIVER':
    case 'AMBULANCE_PROVIDER_ADMIN': return 'var(--color-ambulance)';
    case 'BLOOD_BANK_ADMIN':
    case 'BLOOD_BANK_STAFF': return 'var(--color-critical-light)';
    default: return 'var(--color-text-muted)';
  }
};

export const AppTopbar: React.FC<AppTopbarProps> = ({
  pageTitle: _pageTitle,
  unreadCount,
  activeTab = 'home',
  navItems = [],
  onTabChange,
  onMenuToggle,
  onOpenNotifications,
}) => {
  const { theme, toggleTheme, language, setLanguage } = useThemeLanguage();
  const { signOut, activeRole } = useAuth();
  const [soundOn, setSoundOn] = useState(notificationService.isSoundEnabled());
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    notificationService.setSoundEnabled(next);
  };

  // Primary home tab ID for the active role (e.g. 'home' for Patient, 'hospital' for Hospital, 'bloodbank' for Blood Bank, 'ambulance' for Ambulance)
  const primaryHomeId = navItems[0]?.id || (activeRole === 'PATIENT' ? 'home' : activeRole.startsWith('HOSPITAL') ? 'hospital' : activeRole.startsWith('BLOOD_BANK') ? 'bloodbank' : activeRole.startsWith('AMBULANCE') ? 'ambulance' : 'home');

  // Role-scoped desktop navigation links from navItems
  const displayLinks = navItems.length > 0
    ? navItems.slice(0, 7)
    : [
        { id: 'home', label: 'Home' },
        { id: 'emergency', label: 'Emergency', isCritical: true },
        { id: 'appointments', label: 'Appointments' },
        { id: 'discovery', label: 'Healthcare' },
        { id: 'donor', label: 'Donor' },
        { id: 'profile', label: 'Profile' },
      ];

  return (
    <header className="lx-topbar" aria-label="Top Application Bar">
      {/* Brand & Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lx-icon-btn"
          aria-label="Toggle navigation drawer"
          title="More tools & modes"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* LifelineX Logo */}
        <button
          onClick={() => onTabChange?.(primaryHomeId)}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
          aria-label={`Go to ${getRoleTitle(activeRole)} Home`}
        >
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #0F4C47 0%, #16655F 100%)',
              color: 'white',
            }}
            aria-hidden="true"
          >
            <Radio className="w-5 h-5 text-[#E2F2A4]" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-0.5">
              <span>Lifeline</span>
              <span className="text-[#0F4C47] dark:text-[#E2F2A4]">X</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
              Care &amp; Emergency
            </div>
          </div>
        </button>
      </div>

      {/* Desktop Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-full border border-slate-200/80 dark:border-slate-800">
        {displayLinks.map((link) => {
          const isActive = activeTab === link.id || (link.id === 'discovery' && (activeTab === 'discovery' || activeTab === 'map'));
          return (
            <button
              key={link.id}
              onClick={() => onTabChange?.(link.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-[#0F4C47] text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {link.isCritical && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action Controls */}
      <div className="lx-topbar-actions flex items-center gap-2.5">
        {/* Quick Emergency SOS Pill */}
        <button
          onClick={() => onTabChange?.('emergency')}
          className="lx-btn lx-btn-emergency lx-btn-sm hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
          title="Immediate Emergency Response"
          aria-label="Get Emergency Help"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-rose-100" />
          <span>SOS Help</span>
        </button>

        {/* Professional Mode Switcher */}
        <button
          onClick={() => setIsModeModalOpen(true)}
          className="lx-btn lx-btn-secondary lx-btn-sm flex items-center gap-2 cursor-pointer"
          aria-label={`Current mode: ${getRoleTitle(activeRole)}. Click to switch mode.`}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: getRoleColor(activeRole) }}
            aria-hidden="true"
          />
          <span
            className="text-xs font-bold hidden sm:inline"
            style={{ color: activeRole === 'DONOR' ? '#7e22ce' : 'inherit' }}
          >
            {getRoleTitle(activeRole)}
          </span>
          <span
            className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
          >
            Switch
          </span>
        </button>

        {/* Mode Switcher Dialog */}
        <ModeSwitcherModal
          isOpen={isModeModalOpen}
          onClose={() => setIsModeModalOpen(false)}
        />

        {/* Language Selector */}
        <div
          className="flex items-center"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '5px 8px',
          }}
        >
          <Globe className="w-3.5 h-3.5 mr-1.5" style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="lx-select"
            style={{ background: 'transparent', border: 'none', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', padding: 0, minHeight: 'unset' }}
            aria-label="Select Language"
          >
            {supportedLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={soundOn ? 'Audible Chimes Enabled' : 'Audible Chimes Muted'}
          className="lx-icon-btn"
          aria-label={soundOn ? 'Mute chimes' : 'Enable audio chimes'}
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="lx-icon-btn"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="lx-icon-btn relative"
          aria-label={`Open notifications (${unreadCount} unread)`}
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-slate-950"
              aria-hidden="true"
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={() => signOut()}
          className="lx-icon-btn"
          title="Sign Out of LifelineX"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4 text-rose-400 hover:text-rose-300" />
        </button>
      </div>
    </header>
  );
};
