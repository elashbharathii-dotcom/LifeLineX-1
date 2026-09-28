/**
 * LifelineX Environment Configuration Validator
 * Enforces strict environment boundaries and fails safely if production config is missing.
 */

export interface EnvironmentConfig {
  appEnv: 'development' | 'staging' | 'production';
  supabaseUrl: string;
  supabaseAnonKey: string;
  mapTileServer: string;
  isPilotMode: boolean;
  isValid: boolean;
  errors: string[];
}

export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];

  const appEnv = (import.meta.env.VITE_APP_ENV || 'development') as 'development' | 'staging' | 'production';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const mapTileServer = import.meta.env.VITE_MAP_TILE_SERVER || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const isPilotMode = import.meta.env.VITE_PILOT_MODE === 'true' || appEnv !== 'production';

  // Production and Staging strict validations
  if (appEnv === 'production' || appEnv === 'staging') {
    if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('localhost')) {
      errors.push(`Invalid VITE_SUPABASE_URL for ${appEnv} environment: must point to an authorized HTTPS Supabase instance.`);
    }

    if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder') || supabaseAnonKey.length < 50) {
      errors.push(`Invalid VITE_SUPABASE_ANON_KEY for ${appEnv} environment: missing valid JWT.`);
    }
  }

  // Check for illegal client-side secrets leakage in env
  const envKeys = Object.keys(import.meta.env);
  const leakedSecrets = envKeys.filter(k => 
    k.toUpperCase().includes('SERVICE_ROLE') || 
    k.toUpperCase().includes('SECRET_KEY') || 
    k.toUpperCase().includes('PRIVATE_KEY')
  );

  if (leakedSecrets.length > 0) {
    errors.push(`CRITICAL SECURITY LEAK: Private keys detected in frontend client env: ${leakedSecrets.join(', ')}`);
  }

  return {
    appEnv,
    supabaseUrl,
    supabaseAnonKey,
    mapTileServer,
    isPilotMode,
    isValid: errors.length === 0,
    errors,
  };
}

export const envConfig = validateEnvironment();
