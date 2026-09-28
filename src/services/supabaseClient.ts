import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * PLACEHOLDER PATTERNS — any URL or key matching these will cause
 * isSupabaseConfigured() to return false, preventing DNS requests to
 * non-existent Supabase projects.
 */
const PLACEHOLDER_URL_PATTERNS = [
  'your-project',
  'mock-lifelinex',
  'dev-lifelinex',
  'staging-lifelinex',
  'prod-api.lifelinex',
  'placeholder',
  'example',
  'localhost',
];

const PLACEHOLDER_KEY_PATTERNS = [
  'placeholder',
  'mock',
  'dev-anon',
  'staging-anon',
  'prod-anon',
  'your-anon',
];

export const isSupabaseConfigured = (): boolean => {
  if (!SUPABASE_URL || SUPABASE_URL.trim() === '') return false;
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim() === '') return false;

  // Must be a real HTTPS Supabase URL
  if (!SUPABASE_URL.startsWith('https://')) return false;

  // Reject known placeholder domains
  const urlLower = SUPABASE_URL.toLowerCase();
  if (PLACEHOLDER_URL_PATTERNS.some((p: string) => urlLower.includes(p))) return false;

  // Reject placeholder keys
  const keyLower = SUPABASE_ANON_KEY.toLowerCase();
  if (PLACEHOLDER_KEY_PATTERNS.some((p: string) => keyLower.includes(p))) return false;

  // Supabase public client keys can be:
  // 1. Modern Supabase publishable keys (prefixed with 'sb_publishable_')
  // 2. Standard JWT anon keys (prefixed with 'eyJ' with 3 base64 segments)
  const isPublishableKey = SUPABASE_ANON_KEY.startsWith('sb_publishable_') && SUPABASE_ANON_KEY.length >= 20;
  const isJwtKey = SUPABASE_ANON_KEY.startsWith('eyJ') && SUPABASE_ANON_KEY.split('.').length === 3;

  if (!isPublishableKey && !isJwtKey && SUPABASE_ANON_KEY.length < 20) return false;

  return true;
};

/**
 * The Supabase client instance.
 * When isSupabaseConfigured() returns false, this client is pointed at an
 * intentionally invalid URL. All callers MUST guard with isSupabaseConfigured()
 * before invoking any Supabase API to prevent DNS requests to placeholder domains.
 */
export const supabase = createClient(
  SUPABASE_URL || 'https://unconfigured.invalid',
  SUPABASE_ANON_KEY || 'unconfigured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
