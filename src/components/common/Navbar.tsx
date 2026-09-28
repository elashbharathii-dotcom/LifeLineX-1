import React from 'react';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { RoleSwitcher } from './RoleSwitcher';
import { supportedLanguages, LanguageCode } from '../../i18n';
import {
  Activity,
  Bell,
  Volume2,
  VolumeX,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';

interface Props {
  activeTab?: string;
  setActiveTab: (tab: string) => void;
  unreadNotifCount: number;
  onOpenNotifDrawer: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab: _activeTab,
  setActiveTab,
  unreadNotifCount,
  onOpenNotifDrawer,
}) => {
  const { theme, toggleTheme, language, setLanguage } = useThemeLanguage();
  const [soundOn, setSoundOn] = React.useState(notificationService.isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    notificationService.setSoundEnabled(next);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div
            onClick={() => setActiveTab('emergency')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-rose-400 bg-clip-text text-transparent">
                  Lifeline<span className="text-rose-500">X</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PROD v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Emergency Healthcare Grid</p>
            </div>
          </div>

          {/* Quick Controls on Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenNotifDrawer}
              className="relative p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Role Switcher & Environment Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
          <RoleSwitcher />

          {/* Language Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-slate-100">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Audible Chimes Enabled' : 'Audible Chimes Muted'}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
              soundOn
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifDrawer}
            className="hidden md:flex relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                {unreadNotifCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
