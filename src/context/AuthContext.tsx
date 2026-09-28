import { createContext, useContext } from 'react';
import {
  CurrentUserSession,
  AuthState,
  OnboardingData,
} from '../services/authService';
import { UserRoleType, Profile } from '../types/database';

interface AuthContextType {
  session: CurrentUserSession | null;
  profile: Profile | null;
  activeRole: UserRoleType;
  availableRoles: UserRoleType[];
  allProfiles: Profile[];
  authState: AuthState;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  completeOnboarding: (data: OnboardingData) => Promise<{ error: string | null; profile?: Profile }>;
  loginWithInstitutionalCredentials: (
    identifier: string,
    password?: string
  ) => Promise<{ error: string | null; role?: UserRoleType; organizationName?: string }>;
  signOut: () => Promise<void>;
  loginWithDeveloperSandbox: (profileId?: string, role?: UserRoleType) => void;
  switchUser: (profileId: string, role?: UserRoleType) => void;
  switchRole: (role: UserRoleType) => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
