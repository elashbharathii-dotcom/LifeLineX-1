import React, { useState, useEffect } from 'react';
import { ThemeLanguageContext } from './ThemeLanguageContext';
import { AuthContext } from './AuthContext';
import { EmergencyContext } from './EmergencyContext';
import { LanguageCode, getTranslation } from '../i18n';
import {
  authService,
  CurrentUserSession,
  AuthState,
} from '../services/authService';
import { emergencyService } from '../services/emergencyService';
import { dbAdapter } from '../services/databaseAdapter';
import { EmergencySession, EmergencyEvent, EmergencyStatusType, Profile } from '../types/database';
import { useAuth } from './AuthContext';

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('lifelinex_theme') as 'dark' | 'light' | null;
      if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
    }
    return 'light';
  });
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('lifelinex_lang') as LanguageCode | null;
      if (storedLang) return storedLang;
    }
    return 'en';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('lifelinex_theme', next);
  };

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('lifelinex_lang', lang);
  };

  const t = (key: string) => getTranslation(key, language);

  return (
    <ThemeLanguageContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      <div className={theme === 'dark' ? 'dark text-slate-100 bg-slate-950' : 'light text-slate-900 bg-slate-50'}>
        {children}
      </div>
    </ThemeLanguageContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<CurrentUserSession | null>(authService.getSession());
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [allProfiles, setAllProfiles] = useState<Profile[]>(authService.getAllProfiles());

  useEffect(() => {
    const unsub = authService.subscribe((sess, state) => {
      setSession(sess);
      setAuthState(state);
      setAllProfiles(authService.getAllProfiles());
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile: session?.profile || null,
        activeRole: session?.activeRole || 'PATIENT',
        availableRoles: session?.availableRoles || ['PATIENT'],
        allProfiles,
        authState,
        signInWithGoogle: (redirectTo) => authService.signInWithGoogle(redirectTo),
        sendPhoneOtp: (phone) => authService.sendPhoneOtp(phone),
        verifyPhoneOtp: (phone, token) => authService.verifyPhoneOtp(phone, token),
        completeOnboarding: (data) => authService.completeOnboarding(data),
        signOut: () => authService.signOut(),
        loginWithInstitutionalCredentials: (id, pass) => authService.loginWithInstitutionalCredentials(id, pass),
        loginWithDeveloperSandbox: (pid, r) => authService.loginWithDeveloperSandbox(pid, r),
        switchUser: (pid, r) => authService.switchUser(pid, r),
        switchRole: (r) => authService.switchRole(r),
        updateProfile: (up) => authService.updateProfile(up),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, activeRole } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState<EmergencySession | null>(
    () => emergencyService.getActiveEmergency()
  );
  const [events, setEvents] = useState<EmergencyEvent[]>(() => {
    const current = emergencyService.getActiveEmergency();
    return current ? emergencyService.getEventsForSession(current.id) : [];
  });

  const refreshEmergency = () => {
    const current = emergencyService.getActiveEmergency();
    setActiveEmergency(current);
    if (current) {
      setEvents(emergencyService.getEventsForSession(current.id));
    } else {
      setEvents([]);
    }
  };

  useEffect(() => {
    const unsub1 = dbAdapter.subscribe('emergency_sessions', refreshEmergency);
    const unsub2 = dbAdapter.subscribe('emergency_events', refreshEmergency);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const triggerSOS = async (notes?: string) => {
    const pId = profile?.id || '11111111-1111-1111-1111-111111111101';
    const lat = profile?.latitude || 13.0827;
    const lon = profile?.longitude || 80.2707;
    const session = await emergencyService.createEmergencySession(pId, lat, lon, notes);
    refreshEmergency();
    return session;
  };

  const updateStatus = (newStatus: EmergencyStatusType, title: string, description: string) => {
    if (!activeEmergency) return;
    emergencyService.updateStatus(activeEmergency.id, newStatus, title, description, profile?.id, activeRole);
    refreshEmergency();
  };

  return (
    <EmergencyContext.Provider
      value={{
        activeEmergency,
        events,
        triggerSOS,
        updateStatus,
        refreshEmergency,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};
