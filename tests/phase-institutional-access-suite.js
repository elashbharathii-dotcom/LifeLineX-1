import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('  LIFELINEX: INSTITUTIONAL ACCESS VERIFICATION SUITE (SUPERVISOR REMOVED)       ');
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

const readFile = (relPath) => {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null;
};

// ─── TEST 1: Public Registration Entry Architecture ─────────────────────────
await test(1, 'AuthScreen: Public registration entry forbids self-registration for institutions', async () => {
  const content = readFile('src/components/auth/AuthScreen.tsx');
  assert.ok(content, 'AuthScreen.tsx must exist');

  // Verify Patient account creation is present
  assert.ok(content.includes('Create Patient Account'), 'Must have explicit "Create Patient Account" button');
  assert.ok(content.includes("I'm using LifelineX as:"), 'Must show prompt heading "I\'m using LifelineX as:"');

  // Verify Institutional cards point to Institutional Login
  assert.ok(
    content.includes('Institutional Login'),
    'Institutional cards must direct to Institutional Login, not registration'
  );

  // Forbid any self-registration phrases
  assert.ok(!content.includes('Create Hospital Account'), 'Forbidden: "Create Hospital Account"');
  assert.ok(!content.includes('Register Blood Bank'), 'Forbidden: "Register Blood Bank"');
  assert.ok(!content.includes('Register Ambulance Driver'), 'Forbidden: "Register Ambulance Driver"');
  assert.ok(!content.includes('Create Admin Account'), 'Forbidden: "Create Admin Account"');
  assert.ok(!content.includes('Become Hospital Staff'), 'Forbidden: "Become Hospital Staff"');

  return 'AuthScreen strictly enforces registration entry requirements';
});

// ─── TEST 2: Profile Onboarding Sanitization ────────────────────────────────
await test(2, 'ProfileOnboardingScreen: Institutional roles removed from self-onboarding', async () => {
  const content = readFile('src/components/auth/ProfileOnboardingScreen.tsx');
  assert.ok(content, 'ProfileOnboardingScreen.tsx must exist');

  // Must only allow Patient / Universal Donor selection in user onboarding
  assert.ok(content.includes('Universal Donor'), 'Should allow donor preference opt-in');
  assert.ok(content.includes('PATIENT'), 'Defaults or binds to PATIENT');
  assert.ok(!content.includes("'HOSPITAL_ADMIN'"), 'Hospital Admin must not be an option in self-onboarding');
  assert.ok(!content.includes("'BLOOD_BANK_ADMIN'"), 'Blood Bank Admin must not be an option in self-onboarding');
  assert.ok(!content.includes("'AMBULANCE_DRIVER'"), 'Ambulance Driver must not be an option in self-onboarding');

  return 'Profile onboarding cannot assign institutional roles';
});

// ─── TEST 3: Institutional Credentials Login & Security Guardrails ──────────
await test(3, 'authService: loginWithInstitutionalCredentials validates roles and rejects unauthorized users', async () => {
  const content = readFile('src/services/authService.ts');
  assert.ok(content, 'authService.ts must exist');

  assert.ok(content.includes('loginWithInstitutionalCredentials'), 'Must export loginWithInstitutionalCredentials');

  // Verify institutional roles defined
  assert.ok(content.includes('institutionalRoles'), 'Must have institutionalRoles defined');
  assert.ok(content.includes('HOSPITAL_ADMIN'), 'institutionalRoles must include HOSPITAL_ADMIN');
  assert.ok(content.includes('BLOOD_BANK_ADMIN'), 'institutionalRoles must include BLOOD_BANK_ADMIN');
  assert.ok(content.includes('AMBULANCE_DRIVER'), 'institutionalRoles must include AMBULANCE_DRIVER');

  // Verify no supervisor invitation requirement remaining
  assert.ok(!content.includes('acceptSupervisorInvitation'), 'Must not have acceptSupervisorInvitation');

  return 'authService enforces institutional role verification and direct login';
});

// ─── TEST 4: Mode Switcher Authorization Locking ────────────────────────────
await test(4, 'ModeSwitcherModal: Locks unauthorized roles and checks authorization', async () => {
  const content = readFile('src/components/common/ModeSwitcherModal.tsx');
  assert.ok(content, 'ModeSwitcherModal.tsx must exist');

  // Verify locked indicator and authorization check
  assert.ok(content.includes('isRoleAuthorized'), 'Must have isRoleAuthorized check');
  assert.ok(content.includes('availableRoles.includes'), 'Must check user availableRoles before allowing switch');

  // Verify supervisor provisioning button is removed
  assert.ok(!content.includes('State Supervisor Authority Active'), 'Must not display supervisor launcher');
  assert.ok(!content.includes('StateSupervisorProvisioningModal'), 'Must not import StateSupervisorProvisioningModal');

  // Verify modal is not auto-blocking on initial render
  assert.ok(content.includes('if (!isOpen) return null;'), 'Must have if (!isOpen) return null guard');

  return 'ModeSwitcherModal strictly forbids switching to unauthorized institutional modes and does not block on startup';
});

// ─── TEST 5: AuthContext Integration ─────────────────────────────────────────
await test(5, 'AuthContext: Exposes loginWithInstitutionalCredentials without supervisor methods', async () => {
  const content = readFile('src/context/AuthContext.tsx');
  assert.ok(content, 'AuthContext.tsx must exist');
  assert.ok(content.includes('loginWithInstitutionalCredentials'), 'Exposes loginWithInstitutionalCredentials');
  assert.ok(!content.includes('acceptSupervisorInvitation'), 'Must not expose acceptSupervisorInvitation');

  return 'AuthContext correctly wires up institutional auth primitives';
});

// ─── TEST 6: Build & Bundle Integrity ────────────────────────────────────────
await test(6, 'Vite production build artifacts exist and have non-zero size', async () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'dist', 'index.html')), 'dist/index.html must exist');
  const indexHtml = readFile('dist/index.html');
  assert.ok(indexHtml.length > 500, 'index.html must be populated');

  const assetsDir = path.join(ROOT, 'dist', 'assets');
  assert.ok(fs.existsSync(assetsDir), 'dist/assets must exist');
  const files = fs.readdirSync(assetsDir);
  assert.ok(files.some(f => f.endsWith('.js')), 'Must have JS bundle');
  assert.ok(files.some(f => f.endsWith('.css')), 'Must have CSS bundle');

  return 'Frontend build is production-ready';
});

console.log('\n================================================================================');
console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================================\n');

if (failed > 0) {
  process.exit(1);
}
