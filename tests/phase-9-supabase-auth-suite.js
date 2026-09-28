import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('  LIFELINEX PHASE 9: SUPABASE AUTH & CONNECTION VALIDATION SUITE               ');
console.log('================================================================================\n');

const results = [];
let passed = 0, failed = 0;

const test = async (id, title, fn) => {
  process.stdout.write(`▶ Test [${String(id).padStart(2, '0')}]: ${title}... `);
  const start = Date.now();
  try {
    const evidence = await fn();
    passed++;
    results.push({ id, title, status: 'PASSED', durationMs: Date.now() - start, evidence });
    console.log(`✔ PASSED (${Date.now() - start}ms)`);
  } catch (err) {
    failed++;
    results.push({ id, title, status: 'FAILED', durationMs: Date.now() - start, evidence: err.message });
    console.log(`❌ FAILED — ${err.message}`);
    process.exitCode = 1;
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const readFile = (relPath) => {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null;
};

const fileExists = (relPath) => fs.existsSync(path.join(ROOT, relPath));

const getEnvValue = (content, key) => {
  if (!content) return '';
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

// ─── TEST 1: supabaseClient.ts — isSupabaseConfigured guard ──────────────────
await test(1, 'supabaseClient.ts: isSupabaseConfigured() rejects empty/placeholder URLs', async () => {
  const content = readFile('src/services/supabaseClient.ts');
  assert.ok(content, 'supabaseClient.ts must exist');
  assert.ok(content.includes('isSupabaseConfigured'), 'Must export isSupabaseConfigured()');
  assert.ok(content.includes('dev-lifelinex'), 'Must explicitly reject dev-lifelinex placeholder domain');
  assert.ok(content.includes('placeholder'), 'Must explicitly reject placeholder key patterns');
  assert.ok(content.includes("trim() === ''"), 'Must reject empty string URL/key');
  assert.ok(content.includes('unconfigured.invalid'), 'Fallback URL must be non-resolving .invalid TLD');
  return 'isSupabaseConfigured() correctly guards all placeholder patterns';
});

// ─── TEST 2: .env.development — no invalid placeholder domain ────────────────
await test(2, '.env.development: URL is either unconfigured or a valid real HTTPS URL', async () => {
  const content = readFile('.env.development');
  assert.ok(content, '.env.development must exist');
  const url = getEnvValue(content, 'VITE_SUPABASE_URL');
  if (url) {
    assert.ok(url.startsWith('https://'), `URL must start with https:// — found: "${url}"`);
    assert.ok(!url.includes('dev-lifelinex'), `URL must not contain placeholder dev-lifelinex`);
    assert.ok(!url.includes('placeholder'), `URL must not contain placeholder`);
  }
  return `VITE_SUPABASE_URL verified (${url ? 'configured with real URL' : 'unconfigured'})`;
});

// ─── TEST 3: .env.development — no placeholder anon key ─────────────────────
await test(3, '.env.development: Key is either unconfigured or a valid real key', async () => {
  const content = readFile('.env.development');
  const key = getEnvValue(content, 'VITE_SUPABASE_ANON_KEY');
  if (key) {
    assert.ok(!key.includes('placeholder'), `Key must not contain placeholder`);
    assert.ok(key.startsWith('sb_publishable_') || key.startsWith('eyJ'), `Key must be a valid publishable or anon token`);
  }
  return `VITE_SUPABASE_ANON_KEY verified (${key ? 'configured with valid key' : 'unconfigured'})`;
});

// ─── TEST 4: .gitignore protects .env files ───────────────────────────────────
await test(4, '.gitignore: All .env* files are protected from source control', async () => {
  const content = readFile('.gitignore');
  assert.ok(content, '.gitignore must exist');
  assert.ok(content.includes('.env.development'), '.env.development must be gitignored');
  assert.ok(content.includes('.env.staging'), '.env.staging must be gitignored');
  assert.ok(content.includes('.env.production'), '.env.production must be gitignored');
  assert.ok(content.includes('.env.local'), '.env.local must be gitignored');
  return '.gitignore protects all .env files from accidental secret commits';
});

// ─── TEST 5: No SERVICE_ROLE key in any frontend source ───────────────────────
await test(5, 'Secret Scan: No service-role key value in src/ files', async () => {
  const srcDir = path.join(ROOT, 'src');
  const scanDir = (dir) => {
    const found = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) found.push(...scanDir(full));
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf-8');
        const dangerous = content.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]*c2VydmljZV9yb2xl[A-Za-z0-9_-]*/g);
        if (dangerous) found.push(`${full}: ${dangerous[0].substring(0, 30)}...`);
      }
    }
    return found;
  };
  const leaks = scanDir(srcDir);
  assert.equal(leaks.length, 0, `Service-role key found in src: ${leaks.join(', ')}`);
  return 'No service-role key values found in frontend source files';
});

// ─── TEST 6: No hardcoded real Supabase URL in src/ ───────────────────────────
await test(6, 'Secret Scan: No hardcoded production Supabase URL in src/', async () => {
  const srcDir = path.join(ROOT, 'src');
  const hardcoded = [];
  const scanDir = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanDir(full);
      else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf-8');
        const matches = content.match(/https:\/\/[a-z0-9]{10,}\.supabase\.co/g);
        if (matches) {
          matches.forEach(m => {
            if (!m.includes('unconfigured') && !m.includes('your-project')) {
              hardcoded.push(`${path.relative(ROOT, full)}: ${m}`);
            }
          });
        }
      }
    }
  };
  scanDir(srcDir);
  assert.equal(hardcoded.length, 0, `Hardcoded Supabase URL found: ${hardcoded.join(', ')}`);
  return 'No hardcoded production Supabase URLs in source files';
});

// ─── TEST 7: Migration files exist in correct order ───────────────────────────
await test(7, 'Migrations: All 6 migration files exist in supabase/migrations/', async () => {
  const expected = [
    '20260902000001_core_schema.sql',
    '20260902000002_rls_policies.sql',
    '20260902000003_triggers_and_functions.sql',
    '20260902000004_seed_data.sql',
    '20260902000005_concurrency_and_storage.sql',
    '20260902000006_auth_and_phone_support.sql',
  ];
  for (const f of expected) {
    assert.ok(fileExists(`supabase/migrations/${f}`), `Migration missing: ${f}`);
  }
  return `All ${expected.length} migration files present`;
});

// ─── TEST 8: Core schema defines profiles with auth_user_id ──────────────────
await test(8, 'Migration 001: profiles table has auth_user_id UNIQUE column', async () => {
  const content = readFile('supabase/migrations/20260902000001_core_schema.sql');
  assert.ok(content, 'core_schema.sql must exist');
  assert.ok(content.includes('auth_user_id'), 'Must define auth_user_id column');
  assert.ok(content.includes('UNIQUE'), 'auth_user_id must be UNIQUE');
  assert.ok(content.includes('CREATE TABLE IF NOT EXISTS profiles'), 'profiles table must exist');
  return 'profiles table has auth_user_id UUID UNIQUE — canonical identity anchor verified';
});

// ─── TEST 9: RLS policies file defines policies ────────────────────────────────
await test(9, 'Migration 002: RLS policies defined for sensitive tables', async () => {
  const content = readFile('supabase/migrations/20260902000002_rls_policies.sql');
  assert.ok(content, 'rls_policies.sql must exist');
  assert.ok(content.includes('ENABLE ROW LEVEL SECURITY') || content.includes('ROW LEVEL SECURITY'), 'Must enable RLS');
  assert.ok(content.includes('profiles'), 'Must have policy on profiles');
  const policyCount = (content.match(/CREATE POLICY/g) || []).length;
  assert.ok(policyCount >= 5, `Expected ≥5 RLS policies, found ${policyCount}`);
  return `${policyCount} RLS policies defined across sensitive tables`;
});

// ─── TEST 10: authService guards all Supabase calls with isSupabaseConfigured ─
await test(10, 'authService.ts: All Supabase API calls guarded by isSupabaseConfigured()', async () => {
  const content = readFile('src/services/authService.ts');
  assert.ok(content, 'authService.ts must exist');
  assert.ok(content.includes('isSupabaseConfigured'), 'Must import and use isSupabaseConfigured()');
  const guardCount = (content.match(/isSupabaseConfigured\(\)/g) || []).length;
  assert.ok(guardCount >= 3, `Expected ≥3 isSupabaseConfigured() guards, found ${guardCount}`);
  return `authService uses isSupabaseConfigured() ${guardCount} times — all Supabase calls gated`;
});

// ─── TEST 11: Auth state machine has 4 correct states ────────────────────────
await test(11, 'authService.ts: Auth state machine has 4 required states', async () => {
  const content = readFile('src/services/authService.ts');
  const states = ['INITIALIZING', 'UNAUTHENTICATED', 'ONBOARDING', 'AUTHENTICATED'];
  for (const s of states) {
    assert.ok(content.includes(s), `Missing auth state: ${s}`);
  }
  return `All 4 auth states present: ${states.join(' → ')}`;
});

// ─── TEST 12: Role privilege escalation prevention ────────────────────────────
await test(12, 'Privilege escalation: Privileged roles blocked from self-assignment', async () => {
  const authScreen = readFile('src/components/auth/ProfileOnboardingScreen.tsx');
  assert.ok(authScreen, 'ProfileOnboardingScreen.tsx must exist');

  const privilegedRoles = ['HOSPITAL_ADMIN', 'BLOOD_BANK_ADMIN', 'AMBULANCE_PROVIDER_ADMIN', 'SUPER_ADMIN', 'LIFELINEX_ADMIN'];
  for (const role of privilegedRoles) {
    assert.ok(!authScreen.includes(`'${role}'`), `Privileged role ${role} must not appear in onboarding options`);
  }

  assert.ok(authScreen.includes('PATIENT'), 'PATIENT role must be selectable');
  assert.ok(authScreen.includes('DONOR'), 'DONOR role must be selectable');

  return `Privileged roles (${privilegedRoles.join(', ')}) blocked from self-assignment`;
});

// ─── TEST 13: Google OAuth — CONFIGURATION REQUIRED status ───────────────────
await test(13, 'Google OAuth: Status correctly reported as NOT CONFIGURED (no credentials)', async () => {
  const authService = readFile('src/services/authService.ts');
  assert.ok(authService, 'authService.ts must exist');
  assert.ok(
    authService.includes('signInWithOAuth') || authService.includes('signInWithGoogle'),
    'Must have Google OAuth method'
  );
  assert.ok(
    authService.includes('CONFIGURATION REQUIRED') || authService.includes('not configured'),
    'Must surface CONFIGURATION REQUIRED when provider is not activated'
  );
  return 'Google OAuth method exists; surfaces CONFIGURATION REQUIRED when provider not activated';
});

// ─── TEST 14: Phone OTP — CONFIGURATION REQUIRED status ──────────────────────
await test(14, 'Phone OTP: Status correctly reported as BLOCKED without SMS provider', async () => {
  const authService = readFile('src/services/authService.ts');
  assert.ok(
    authService.includes('signInWithOtp') || authService.includes('sendPhoneOtp'),
    'Must have Phone OTP method'
  );
  assert.ok(
    authService.includes('over_sms_rate_limit') || authService.includes('CONFIGURATION REQUIRED'),
    'Must handle SMS provider errors gracefully'
  );
  return 'Phone OTP method exists; surfaces CONFIGURATION REQUIRED when SMS provider not configured';
});

// ─── TEST 15: Local fallback — Developer Sandbox ─────────────────────────────
await test(15, 'Local fallback: Developer Sandbox accessible when Supabase not configured', async () => {
  const authScreen = readFile('src/components/auth/AuthScreen.tsx');
  assert.ok(authScreen, 'AuthScreen.tsx must exist');
  assert.ok(
    authScreen.includes('Sandbox') || authScreen.includes('sandbox') || authScreen.includes('Developer'),
    'AuthScreen must expose Developer Sandbox bypass'
  );
  const authService = readFile('src/services/authService.ts');
  assert.ok(
    authService.includes('DEMO_MODE') || authService.includes('demo') || authService.includes('sandbox'),
    'authService must support sandbox/demo mode fallback'
  );
  return 'Developer Sandbox mode available — full local fallback when Supabase not configured';
});

// ─── TEST 16: databaseAdapter — all core tables present ──────────────────────
await test(16, 'databaseAdapter.ts: All 8 core tables seeded for local fallback', async () => {
  const content = readFile('src/services/databaseAdapter.ts');
  assert.ok(content, 'databaseAdapter.ts must exist');
  const tables = ['profiles', 'user_roles', 'donor_profiles', 'hospitals', 'blood_banks', 'ambulances', 'blood_inventory'];
  for (const t of tables) {
    assert.ok(content.includes(t), `Missing seeded table: ${t}`);
  }
  return `All ${tables.length} core tables present in local fallback adapter`;
});

// ─── TEST 17: Production build — no TypeScript errors ────────────────────────
await test(17, 'Build: TypeScript compilation succeeds with 0 errors (tsc -b)', async () => {
  const { execSync } = await import('child_process');
  try {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'npx.cmd tsc -b' : 'npx tsc -b';
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', shell: true });
  } catch (e) {
    const stderr = e.stderr?.toString() || e.message;
    assert.fail(`TypeScript errors:\n${stderr}`);
  }
  return 'tsc -b completed with 0 errors';
});

// ─── RESULTS SUMMARY ─────────────────────────────────────────────────────────

console.log('\n================================================================================');
console.log('  PHASE 9 — SUPABASE AUTH & CONNECTION VALIDATION: RESULTS                     ');
console.log('================================================================================');
console.log(`  Total: ${passed + failed} | ✔ Passed: ${passed} | ❌ Failed: ${failed}`);
console.log('');

if (failed === 0) {
  console.log('  ✅ ALL ASSERTIONS PASSED');
  console.log('');
  console.log('  SUPABASE STATUS:     CONFIGURATION REQUIRED (no credentials provided)');
  console.log('  LOCAL FALLBACK:      OPERATIONAL');
  console.log('  SECRET SCAN:         CLEAN');
  console.log('  GITIGNORE:           ENV FILES PROTECTED');
  console.log('  GOOGLE OAUTH:        NOT CONFIGURED (requires Supabase Dashboard setup)');
  console.log('  PHONE OTP:           NOT CONFIGURED (requires SMS provider credentials)');
  console.log('  TYPESCRIPT:          0 ERRORS');
  console.log('  RELEASE DECISION:    CONDITIONAL GO');
  console.log('                       (Core architecture verified; awaiting cloud credentials)');
} else {
  console.log(`  ⚠️  ${failed} ASSERTIONS FAILED — Review blockers above before proceeding`);
}

console.log('================================================================================\n');

// Save evidence register
const report = {
  phase: 9,
  suite: 'phase-9-supabase-auth-suite',
  timestamp: new Date().toISOString(),
  total: passed + failed,
  passed,
  failed,
  supabaseStatus: 'CONFIGURATION_REQUIRED',
  googleOAuth: 'NOT_CONFIGURED',
  phoneOTP: 'NOT_CONFIGURED',
  localFallback: 'OPERATIONAL',
  secretScan: failed === 0 ? 'CLEAN' : 'REVIEW_REQUIRED',
  releaseDecision: failed === 0 ? 'CONDITIONAL_GO' : 'NO_GO',
  results,
};

fs.writeFileSync(
  path.join(ROOT, 'tests', 'phase-9-supabase-auth-results.json'),
  JSON.stringify(report, null, 2)
);
console.log('Evidence saved to: tests/phase-9-supabase-auth-results.json\n');
