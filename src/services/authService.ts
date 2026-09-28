import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { dbAdapter } from './databaseAdapter';
import { Profile, UserRoleType, BloodGroupType } from '../types/database';

export interface CurrentUserSession {
  user?: User | null;
  profile: Profile;
  activeRole: UserRoleType;
  availableRoles: UserRoleType[];
  organizationName?: string;
}

export interface OnboardingData {
  full_name: string;
  date_of_birth?: string;
  preferred_language: string;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  role: 'PATIENT' | 'DONOR';
  blood_group?: BloodGroupType;
}

export type AuthState = 'INITIALIZING' | 'UNAUTHENTICATED' | 'ONBOARDING' | 'AUTHENTICATED';

const AUTH_STORAGE_KEY = 'lifelinex_active_user_id';
const ROLE_STORAGE_KEY = 'lifelinex_active_role';
const DEMO_MODE_KEY = 'lifelinex_demo_authenticated';

export const formatAuthError = (err: any): string => {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const msg = err.message || (typeof err === 'string' ? err : '');
  const lower = msg.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('err_name_not_resolved')) {
    return 'CONFIGURATION REQUIRED: Unable to connect to Supabase Auth endpoint. Please ensure valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your environment.';
  }
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('over_sms_rate_limit')) {
    return 'Too many attempts. Please wait 60 seconds before trying again.';
  }
  if (lower.includes('token has expired') || lower.includes('expired')) {
    return 'That verification code has expired. Please request a new code.';
  }
  if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('token')) {
    return 'That verification code is incorrect. Please check and try again.';
  }
  if (lower.includes('popup') || lower.includes('closed') || lower.includes('cancelled')) {
    return 'Google sign-in was cancelled. Please try again.';
  }
  if (lower.includes('provider is not enabled') || lower.includes('unsupported provider') || lower.includes('disabled')) {
    return 'CONFIGURATION REQUIRED: Google OAuth or Phone SMS gateway is not activated in your Supabase Auth settings.';
  }
  return msg || 'Authentication could not be completed. Please try again.';
};

class AuthService {
  private currentSession: CurrentUserSession | null = null;
  private currentUser: User | null = null;
  private currentAuthState: AuthState = 'INITIALIZING';
  private listeners: Set<(session: CurrentUserSession | null, state: AuthState) => void> = new Set();
  private isInitialized = false;

  constructor() {
    this.initSession();
  }

  private async initSession() {
    try {
      if (isSupabaseConfigured()) {
        // Listen to Supabase auth events
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            this.currentUser = session.user;
            await this.resolveProfileForUser(session.user);
          } else {
            // Check if demo/sandbox mode is active
            const isDemo = localStorage.getItem(DEMO_MODE_KEY) === 'true';
            if (isDemo) {
              this.restoreLocalSession();
            } else {
              this.currentSession = null;
              this.currentUser = null;
              this.currentAuthState = 'UNAUTHENTICATED';
              this.notify();
            }
          }
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          this.currentUser = session.user;
          await this.resolveProfileForUser(session.user);
          return;
        }
      }

      // Check if user previously logged in via local sandbox/demo
      const isDemo = localStorage.getItem(DEMO_MODE_KEY) === 'true';
      if (isDemo) {
        this.restoreLocalSession();
      } else {
        this.currentAuthState = 'UNAUTHENTICATED';
        this.currentSession = null;
        this.notify();
      }
    } catch {
      this.currentAuthState = 'UNAUTHENTICATED';
      this.currentSession = null;
      this.notify();
    } finally {
      this.isInitialized = true;
    }
  }

  private async resolveProfileForUser(user: User) {
    try {
      // 1. Check if profile exists in database
      let profile: Profile | null = null;
      let userRoles: UserRoleType[] = [];

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          profile = data as Profile;
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('profile_id', profile.id);
          userRoles = (rolesData || []).map((r: any) => r.role as UserRoleType);
        }
      }

      // Fallback check in local dbAdapter by auth_user_id or email/phone
      if (!profile) {
        const localProfiles = dbAdapter.getTable('profiles') as Profile[];
        profile =
          localProfiles.find(
            (p) =>
              p.auth_user_id === user.id ||
              (user.email && p.email === user.email) ||
              (user.phone && p.phone === user.phone)
          ) || null;

        if (profile) {
          userRoles = dbAdapter
            .getTable('user_roles')
            .filter((ur) => ur.profile_id === profile!.id)
            .map((ur) => ur.role);
        }
      }

      if (profile) {
        // User has completed onboarding!
        const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRoleType) || 'PATIENT';
        const activeRole = userRoles.includes(storedRole) ? storedRole : userRoles[0] || 'PATIENT';

        this.currentSession = {
          user,
          profile,
          activeRole,
          availableRoles: userRoles.length > 0 ? userRoles : ['PATIENT'],
        };
        this.currentAuthState = 'AUTHENTICATED';
        localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
        localStorage.setItem(ROLE_STORAGE_KEY, activeRole);
      } else {
        // Authenticated with provider, but needs profile setup
        this.currentSession = null;
        this.currentAuthState = 'ONBOARDING';
      }
    } catch {
      this.currentAuthState = 'ONBOARDING';
    } finally {
      this.notify();
    }
  }

  private restoreLocalSession() {
    const profiles = dbAdapter.getTable('profiles');
    const storedUserId = localStorage.getItem(AUTH_STORAGE_KEY) || profiles[0]?.id;
    const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRoleType) || 'PATIENT';

    const profile = profiles.find((p) => p.id === storedUserId) || profiles[0];
    if (profile) {
      const userRolesRecords = dbAdapter
        .getTable('user_roles')
        .filter((ur) => ur.profile_id === profile.id);
      const userRoles = userRolesRecords.map((ur) => ur.role as UserRoleType);

      const primaryRole = userRolesRecords.find((ur) => ur.is_primary)?.role || userRoles[0] || 'PATIENT';
      const activeRole = userRoles.includes(storedRole) || (storedRole === 'DONOR' && userRoles.length > 0)
        ? storedRole
        : primaryRole;

      this.currentSession = {
        profile,
        activeRole,
        availableRoles: userRoles.length > 0 ? userRoles : ['PATIENT'],
      };
      this.currentAuthState = 'AUTHENTICATED';
    } else {
      this.currentAuthState = 'UNAUTHENTICATED';
    }
    this.notify();
  }

  // ─── Supabase Auth: Google OAuth ───────────────────────────────────────────
  public async signInWithGoogle(redirectTo?: string): Promise<{ error: string | null }> {
    try {
      const targetUrl = redirectTo || `${window.location.origin}/`;

      if (!isSupabaseConfigured()) {
        return {
          error: 'CONFIGURATION REQUIRED: Live Supabase project is not configured in .env. Use developer sandbox access or bind valid credentials to authenticate with Google.',
        };
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[LifelineX Auth] Google OAuth error:', error);
        }
        return { error: 'Google sign-in could not connect to the authentication service. Please try again.' };
      }

      if (!data?.url) {
        return { error: 'Google sign-in could not connect to the authentication service. Please try again.' };
      }

      // Pre-flight check connectivity before navigation to prevent browser NXDOMAIN crash
      try {
        const parsedUrl = new URL(data.url);
        await fetch(`${parsedUrl.origin}/auth/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000),
          mode: 'no-cors',
        });
        if (import.meta.env.DEV) {
          console.log('[LifelineX Auth] OAuth endpoint reachable, redirecting to provider');
        }
      } catch (connErr) {
        if (import.meta.env.DEV) {
          console.error('[LifelineX Auth] Authentication service unreachable (DNS/Network):', connErr);
        }
        return {
          error: 'Google sign-in could not connect to the authentication service. Please try again.',
        };
      }

      window.location.assign(data.url);
      return { error: null };
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[LifelineX Auth] OAuth initialization error:', err);
      }
      return { error: 'Google sign-in could not connect to the authentication service. Please try again.' };
    }
  }

  // ─── Supabase Auth: Phone + OTP ────────────────────────────────────────────
  public async sendPhoneOtp(phone: string): Promise<{ error: string | null }> {
    try {
      const cleaned = phone.replace(/[\s-]/g, '');
      const formatted = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;

      if (!/^\+[1-9]\d{9,14}$/.test(formatted)) {
        return { error: 'Please enter a valid phone number with country code (e.g. +91 9876543210).' };
      }

      if (!isSupabaseConfigured()) {
        return {
          error: 'CONFIGURATION REQUIRED: Live Supabase project or SMS provider is not configured in .env. Enter valid credentials or use sandbox access for testing.',
        };
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      return { error: null };
    } catch (err) {
      return { error: formatAuthError(err) };
    }
  }

  public async verifyPhoneOtp(phone: string, token: string): Promise<{ error: string | null }> {
    try {
      const cleaned = phone.replace(/[\s-]/g, '');
      const formatted = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;

      if (!token || token.trim().length !== 6) {
        return { error: 'Please enter the complete 6-digit verification code.' };
      }

      if (!isSupabaseConfigured()) {
        return {
          error: 'CONFIGURATION REQUIRED: Live Supabase project is not configured. Real OTP verification requires active SMS gateway.',
        };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: token.trim(),
        type: 'sms',
      });

      if (error) {
        return { error: formatAuthError(error) };
      }

      if (data.user) {
        this.currentUser = data.user;
        await this.resolveProfileForUser(data.user);
      }

      return { error: null };
    } catch (err) {
      return { error: formatAuthError(err) };
    }
  }

  // ─── Profile Onboarding Completion ─────────────────────────────────────────
  public async completeOnboarding(data: OnboardingData): Promise<{ error: string | null; profile?: Profile }> {
    try {
      const authUserId = this.currentUser?.id;

      // Ensure non-privileged role only
      const safeRole: UserRoleType = data.role === 'DONOR' ? 'DONOR' : 'PATIENT';

      const newProfilePayload: Partial<Profile> = {
        auth_user_id: authUserId,
        full_name: data.full_name.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || this.currentUser?.phone || undefined,
        date_of_birth: data.date_of_birth || undefined,
        preferred_language: data.preferred_language || 'en',
        emergency_contact_name: data.emergency_contact_name?.trim() || undefined,
        emergency_contact_phone: data.emergency_contact_phone?.trim() || undefined,
        blood_group: data.blood_group,
        is_active: true,
      };

      let createdProfile: Profile | null = null;

      // 1. Try Supabase Insert if configured
      if (isSupabaseConfigured() && authUserId) {
        const { data: dbProfile, error: profErr } = await supabase
          .from('profiles')
          .insert({
            ...newProfilePayload,
            auth_user_id: authUserId,
          })
          .select()
          .single();

        if (!profErr && dbProfile) {
          createdProfile = dbProfile as Profile;

          // Insert citizen role
          await supabase.from('user_roles').insert({
            profile_id: createdProfile.id,
            role: safeRole,
            is_primary: true,
          });

          // If voluntary donor selected, initialize donor profile
          if (safeRole === 'DONOR' && data.blood_group) {
            await supabase.from('donor_profiles').insert({
              profile_id: createdProfile.id,
              blood_group: data.blood_group,
              availability_status: 'AVAILABLE',
              verification_status: 'PENDING',
            });
          }
        }
      }

      // 2. Also register in local dbAdapter for local reactive tables
      if (!createdProfile) {
        createdProfile = dbAdapter.insert('profiles', {
          ...newProfilePayload,
          auth_user_id: authUserId || `local-auth-${Date.now()}`,
          email: data.email || `citizen-${Date.now()}@lifelinex.health`,
          phone: data.phone || '+91 98765 43210',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
        });
      }

      if (!createdProfile) {
        throw new Error('Failed to create user profile in system.');
      }

      // Ensure user roles entry exists
      const existingRoles = dbAdapter.getTable('user_roles').filter((r) => r.profile_id === createdProfile!.id);
      if (existingRoles.length === 0) {
        dbAdapter.insert('user_roles', {
          profile_id: createdProfile.id,
          role: safeRole,
          is_primary: true,
        });
      }

      if (safeRole === 'DONOR' && data.blood_group) {
        const existingDonor = dbAdapter.getTable('donor_profiles').find((d) => d.profile_id === createdProfile!.id);
        if (!existingDonor) {
          dbAdapter.insert('donor_profiles', {
            profile_id: createdProfile.id,
            blood_group: data.blood_group,
            availability_status: 'AVAILABLE',
            verification_status: 'VERIFIED',
            total_donations_count: 0,
            weight_kg: 65,
            medical_declaration_passed: true,
            privacy_blur_location: true,
            auto_notify_blood_requests: true,
          });
        }
      }

      // Update session state
      this.currentSession = {
        user: this.currentUser,
        profile: createdProfile,
        activeRole: safeRole,
        availableRoles: [safeRole],
      };
      this.currentAuthState = 'AUTHENTICATED';
      localStorage.setItem(AUTH_STORAGE_KEY, createdProfile.id);
      localStorage.setItem(ROLE_STORAGE_KEY, safeRole);
      this.notify();

      return { error: null, profile: createdProfile };
    } catch (err) {
      return { error: formatAuthError(err) };
    }
  }

  // ─── Sign Out ─────────────────────────────────────────────────────────────
  public async signOut(): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore network errors during signout
    } finally {
      this.currentSession = null;
      this.currentUser = null;
      this.currentAuthState = 'UNAUTHENTICATED';
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
      localStorage.removeItem(DEMO_MODE_KEY);
      this.notify();
    }
  }

  // ─── Developer Sandbox Access (for local verification without cloud SMS/OAuth) ──
  public loginWithDeveloperSandbox(profileId?: string, role?: UserRoleType): void {
    const profiles = dbAdapter.getTable('profiles');
    const targetProfile = profiles.find((p) => p.id === profileId) || profiles[0];
    if (!targetProfile) return;

    const userRolesRecords = dbAdapter
      .getTable('user_roles')
      .filter((ur) => ur.profile_id === targetProfile.id);
    const userRoles = userRolesRecords.map((ur) => ur.role as UserRoleType);

    const primaryRole = userRolesRecords.find((ur) => ur.is_primary)?.role || userRoles[0] || 'PATIENT';
    const activeRole = role && (userRoles.includes(role) || role === 'DONOR') ? role : primaryRole;

    this.currentSession = {
      profile: targetProfile,
      activeRole,
      availableRoles: userRoles.length > 0 ? userRoles : ['PATIENT'],
    };
    this.currentAuthState = 'AUTHENTICATED';
    localStorage.setItem(AUTH_STORAGE_KEY, targetProfile.id);
    localStorage.setItem(ROLE_STORAGE_KEY, activeRole);
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    this.notify();
  }

  // ─── Institutional Access ──────────────────────────────────────────────────
  public async loginWithInstitutionalCredentials(
    identifier: string,
    _password?: string
  ): Promise<{ error: string | null; role?: UserRoleType; organizationName?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { error: 'Please enter your institutional email or mobile number.' };
    }

    const institutionalRoles: UserRoleType[] = [
      'HOSPITAL_ADMIN',
      'HOSPITAL_STAFF',
      'BLOOD_BANK_ADMIN',
      'BLOOD_BANK_STAFF',
      'AMBULANCE_PROVIDER_ADMIN',
      'AMBULANCE_DRIVER',
      'LIFELINEX_ADMIN',
      'SUPER_ADMIN',
    ];

    // 1. Search existing profiles
    const allProfiles = dbAdapter.getTable('profiles') as Profile[];
    const matchedProfile = allProfiles.find(
      (p) =>
        (p.email && p.email.toLowerCase() === cleanId) ||
        (p.phone && p.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, ''))
    );

    if (!matchedProfile) {
      return {
        error: 'Invalid institutional credentials. No authorized institutional account found for this identifier.',
      };
    }

    if (matchedProfile.is_active === false) {
      return {
        error: 'Institutional access for this account has been suspended. Please contact your organization administrator.',
      };
    }

    // 2. Check if user has institutional operational role
    const userRolesRecords = dbAdapter
      .getTable('user_roles')
      .filter((ur) => ur.profile_id === matchedProfile.id);
    const userRoles = userRolesRecords.map((ur) => ur.role as UserRoleType);

    const hasInstitutionalRole = userRoles.some((r) => institutionalRoles.includes(r));

    if (!hasInstitutionalRole) {
      return {
        error: 'Institutional access required: This account is not registered for an authorized institutional role.',
      };
    }

    // 3. Successful institutional authentication: resolve primary institutional role
    const primaryRoleRecord = userRolesRecords.find((ur) => ur.is_primary && institutionalRoles.includes(ur.role));
    const primaryInstRole = primaryRoleRecord?.role || userRoles.find((r) => institutionalRoles.includes(r)) || userRoles[0] || 'PATIENT';

    this.currentSession = {
      profile: matchedProfile,
      activeRole: primaryInstRole,
      availableRoles: userRoles,
      organizationName: matchedProfile.full_name,
    };
    this.currentAuthState = 'AUTHENTICATED';
    localStorage.setItem(AUTH_STORAGE_KEY, matchedProfile.id);
    localStorage.setItem(ROLE_STORAGE_KEY, primaryInstRole);
    this.notify();
    dbAdapter.logAudit(matchedProfile.id, 'INSTITUTIONAL_LOGIN', 'profiles', matchedProfile.id, null, { role: primaryInstRole });
    return {
      error: null,
      role: primaryInstRole,
      organizationName: matchedProfile.full_name,
    };
  }

  // ─── Getters & Subscriptions ──────────────────────────────────────────────
  public getSession(): CurrentUserSession | null {
    return this.currentSession;
  }

  public getAuthState(): AuthState {
    return this.currentAuthState;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public subscribe(callback: (session: CurrentUserSession | null, state: AuthState) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentSession, this.currentAuthState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentSession, this.currentAuthState));
  }

  public switchUser(profileId: string, desiredRole?: UserRoleType) {
    const profiles = dbAdapter.getTable('profiles');
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    const userRoles = dbAdapter
      .getTable('user_roles')
      .filter((ur) => ur.profile_id === profile.id)
      .map((ur) => ur.role);

    const activeRole = desiredRole && userRoles.includes(desiredRole)
      ? desiredRole
      : userRoles[0] || 'PATIENT';

    this.currentSession = {
      user: this.currentUser,
      profile,
      activeRole,
      availableRoles: userRoles.length > 0 ? userRoles : ['PATIENT'],
    };

    localStorage.setItem(AUTH_STORAGE_KEY, profile.id);
    localStorage.setItem(ROLE_STORAGE_KEY, activeRole);
    this.notify();
    dbAdapter.logAudit(profile.id, 'USER_SWITCHED', 'profiles', profile.id, null, { activeRole });
  }

  public switchRole(role: UserRoleType) {
    if (!this.currentSession) return;

    // Strict Security Guardrail: Role must be in authorized availableRoles or DONOR
    if (!this.currentSession.availableRoles.includes(role) && role !== 'DONOR') {
      console.warn(`[Security Guardrail] Blocked unauthorized role switch to ${role}. Backend authorization required.`);
      return;
    }

    this.currentSession.activeRole = role;
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    this.notify();
  }

  public getAllProfiles(): Profile[] {
    return dbAdapter.getTable('profiles');
  }

  public updateProfile(updates: Partial<Profile>) {
    if (!this.currentSession) return null;
    const updated = dbAdapter.update('profiles', this.currentSession.profile.id, updates);
    if (updated) {
      this.currentSession.profile = updated;
      this.notify();
    }
    return updated;
  }
}

export const authService = new AuthService();
