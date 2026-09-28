import React, { useState, useEffect, useMemo } from 'react';
import { AppSidebar } from './components/shell/AppSidebar';
import { AppTopbar } from './components/shell/AppTopbar';
import { AppBottomNav } from './components/shell/AppBottomNav';
import { EmergencyCenter } from './components/emergency/EmergencyCenter';
import { DonorDashboard } from './components/donor/DonorDashboard';
import { HospitalCommandCenter } from './components/hospital/HospitalCommandCenter';
import { BloodBankDashboard } from './components/bloodbank/BloodBankDashboard';
import { AmbulanceDriverView } from './components/ambulance/AmbulanceDriverView';
import { AmbulanceFleetDashboard } from './components/ambulance/AmbulanceFleetDashboard';
import { AppointmentManager } from './components/appointments/AppointmentManager';
import { LifelineAIChat } from './components/ai/LifelineAIChat';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { E2EWorkflowRunner } from './components/testing/E2EWorkflowRunner';
import { ResourceDiscoveryHub } from './components/discovery/ResourceDiscoveryHub';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { AuthScreen } from './components/auth/AuthScreen';
import { ProfileOnboardingScreen } from './components/auth/ProfileOnboardingScreen';
import { PatientMap } from './components/maps/PatientMap';
import { HospitalMap } from './components/maps/HospitalMap';
import { AmbulanceMap } from './components/maps/AmbulanceMap';
import { BloodBankMap } from './components/maps/BloodBankMap';
import { DonorMap } from './components/maps/DonorMap';
import { AdminMap } from './components/maps/AdminMap';
import { PatientHome } from './components/patient/PatientHome';
import { PatientProfile } from './components/patient/PatientProfile';
import { PregnancyCareHub } from './components/pregnancy/PregnancyCareHub';
import { HospitalPregnancyCare } from './components/hospital/HospitalPregnancyCare';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import { useEmergency } from './context/EmergencyContext';
import { useThemeLanguage } from './context/ThemeLanguageContext';
import { notificationService } from './services/notificationService';
import { dbAdapter } from './services/databaseAdapter';
import { getRoleNavItems, type NavItem } from './lib/navItems';
import { UserRoleType } from './types/database';
import { Radio, Lock } from 'lucide-react';

export const App: React.FC = () => {
  const { activeRole, profile, authState } = useAuth();
  const { activeEmergency } = useEmergency();
  const { theme } = useThemeLanguage();
  const [tabSelection, setTabSelection] = useState<{ role: UserRoleType; tab: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    if (profile?.id) {
      const notifs = notificationService.getNotificationsForUser(profile.id);
      return notifs.filter((n) => n.status !== 'READ').length;
    }
    return 0;
  });

  // Role-aware nav items
  const navItems: NavItem[] = useMemo(() => getRoleNavItems(activeRole, !!activeEmergency), [activeRole, activeEmergency]);
  const validIds = useMemo(() => navItems.map((n) => n.id), [navItems]);
  const activeTab = useMemo(() => {
    if (tabSelection && tabSelection.role === activeRole && validIds.includes(tabSelection.tab)) {
      return tabSelection.tab;
    }
    return navItems[0]?.id ?? 'emergency';
  }, [tabSelection, activeRole, validIds, navItems]);

  // Unread count realtime subscription
  useEffect(() => {
    const handleUpdate = () => {
      if (profile?.id) {
        const notifs = notificationService.getNotificationsForUser(profile.id);
        setUnreadCount(notifs.filter((n) => n.status !== 'READ').length);
      }
    };
    const unsub = dbAdapter.subscribe('notifications', handleUpdate);
    return () => unsub();
  }, [profile?.id]);

  const activeNavItem = navItems.find((n) => n.id === activeTab) ?? navItems[0];

  const handleTabChange = (id: string) => {
    setTabSelection({ role: activeRole, tab: id });
    setIsSidebarOpen(false);
  };

  // 1. Initializing session check
  if (authState === 'INITIALIZING') {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6${theme === 'light' ? ' theme-light' : ''}`}
        style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
          style={{ background: 'var(--color-primary)', color: 'white', animation: 'pulse-dot 1.5s infinite' }}
        >
          <Radio className="w-7 h-7" />
        </div>
        <div className="text-sm font-bold tracking-tight">LifelineX Network</div>
        <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Restoring secure session…
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Login / Signup Screen
  if (authState === 'UNAUTHENTICATED') {
    return <AuthScreen />;
  }

  // 4. Authenticated but incomplete profile -> Onboarding Screen
  if (authState === 'ONBOARDING') {
    return <ProfileOnboardingScreen />;
  }

  // 4. Authenticated with verified role -> Main Application Shell
  return (
    <div className={`lx-app${theme === 'light' ? ' theme-light' : ''}`}>
      {/* Sidebar */}
      <AppSidebar
        isOpen={isSidebarOpen}
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar overlay on mobile */}
      <div
        className={`lx-sidebar-overlay${isSidebarOpen ? ' show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Main wrapper */}
      <div className="lx-main-wrapper">
        {/* Top bar */}
        <AppTopbar
          pageTitle={activeNavItem?.label ?? 'LifelineX'}
          unreadCount={unreadCount}
          activeTab={activeTab}
          navItems={navItems}
          onTabChange={handleTabChange}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        />

        {/* Content */}
        <main className="lx-content" id="main-content" role="main" aria-label="Main content">
          <ErrorBoundary key={activeTab} fallbackTitle="Section Temporarily Unavailable" onReset={() => handleTabChange('emergency')}>
            {activeTab === 'home'         && <PatientHome onNavigate={handleTabChange} />}
            {activeTab === 'profile'      && <PatientProfile onNavigate={handleTabChange} />}
            {activeTab === 'pregnancy'    && (
              activeRole === 'PATIENT' ? (
                <PregnancyCareHub onNavigate={handleTabChange} />
              ) : activeRole === 'HOSPITAL_ADMIN' || activeRole === 'HOSPITAL_STAFF' ? (
                <HospitalPregnancyCare onNavigate={handleTabChange} />
              ) : (
                <div className="p-8 max-w-lg mx-auto text-center space-y-4 lx-animate-in">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Access Restricted</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Pregnancy Care is exclusively accessible in Patient Mode for personal maternal tracking, or in Hospital Command for authorized clinical obstetric staff.
                  </p>
                  <button
                    onClick={() => handleTabChange(navItems[0]?.id || 'home')}
                    className="lx-btn lx-btn-primary lx-btn-sm inline-flex items-center gap-2"
                  >
                    <span>Return to Dashboard</span>
                  </button>
                </div>
              )
            )}
            {activeTab === 'emergency'    && <EmergencyCenter />}
            {activeTab === 'donor'        && <DonorDashboard />}
            {activeTab === 'discovery'    && <ResourceDiscoveryHub />}
            {activeTab === 'hospital'     && <HospitalCommandCenter onNavigate={handleTabChange} />}
            {activeTab === 'bloodbank'    && <BloodBankDashboard />}
            {activeTab === 'ambulance'    && (
              activeRole === 'AMBULANCE_DRIVER' ? <AmbulanceDriverView /> : <AmbulanceFleetDashboard />
            )}
            {activeTab === 'appointments' && <AppointmentManager />}
            {activeTab === 'map'          && (
              <div className="space-y-4 lx-animate-in">
                <div>
                  <h2 className="text-h3 font-bold text-[var(--color-text-primary)]">
                    {activeRole === 'PATIENT' ? 'Healthcare Facilities & Emergency Grid' :
                     activeRole === 'DONOR' ? 'Nearby Blood Donation Centers & Drives' :
                     activeRole === 'HOSPITAL_ADMIN' || activeRole === 'HOSPITAL_STAFF' ? 'Operational Trauma & Fleet Grid' :
                     activeRole === 'AMBULANCE_DRIVER' ? 'Live GPS Navigation Route' :
                     activeRole === 'AMBULANCE_PROVIDER_ADMIN' ? 'Fleet Telemetry & Dispatch Grid' :
                     activeRole === 'BLOOD_BANK_ADMIN' || activeRole === 'BLOOD_BANK_STAFF' ? 'Cold-Chain Blood Supply Network' :
                     'Unified Network Operations Map'}
                  </h2>
                  <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
                    Role-scoped geolocated map view with privacy-compliant donor radius jitter (~800m).
                  </p>
                </div>
                {activeRole === 'PATIENT' && <PatientMap activeEmergency={activeEmergency} />}
                {activeRole === 'DONOR' && <DonorMap />}
                {(activeRole === 'HOSPITAL_ADMIN' || activeRole === 'HOSPITAL_STAFF') && <HospitalMap />}
                {(activeRole === 'AMBULANCE_DRIVER' || activeRole === 'AMBULANCE_PROVIDER_ADMIN') && <AmbulanceMap />}
                {(activeRole === 'BLOOD_BANK_ADMIN' || activeRole === 'BLOOD_BANK_STAFF') && <BloodBankMap />}
                {(activeRole === 'LIFELINEX_ADMIN' || activeRole === 'SUPER_ADMIN') && <AdminMap />}
              </div>
            )}
            {activeTab === 'ai'           && <LifelineAIChat />}
            {activeTab === 'admin'        && <AdminDashboard />}
            {activeTab === 'testing'      && <E2EWorkflowRunner />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AppBottomNav
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadCount={unreadCount}
      />

      {/* Notifications drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigateTab={handleTabChange}
      />
    </div>
  );
};
