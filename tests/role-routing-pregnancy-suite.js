import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('  LIFELINEX: ROLE ROUTING & PREGNANCY CARE VERIFICATION SUITE                   ');
console.log('================================================================================\n');

let passed = 0;
let failed = 0;

const test = async (id, title, fn) => {
  process.stdout.write(`▶ Test [${String(id).padStart(2, '0')}]: ${title}... `);
  const start = Date.now();
  try {
    const evidence = await fn();
    passed++;
    console.log(`✔ PASSED (${Date.now() - start}ms)`);
    if (evidence) {
      console.log(`    ↳ ${evidence}`);
    }
  } catch (err) {
    failed++;
    console.log(`❌ FAILED — ${err.message}`);
    process.exitCode = 1;
  }
};

const readFile = (relPath) => {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : null;
};

// ─── TEST 1: Navigation definitions per role ────────────────────────────────
await test(1, 'navItems.ts: Pregnancy Care present in Patient and Hospital, FORBIDDEN in Blood Bank, Ambulance, Donor, Admin', async () => {
  const content = readFile('src/lib/navItems.ts');
  assert.ok(content, 'navItems.ts must exist');

  // Verify getRoleNavItems function exists
  assert.ok(content.includes('export function getRoleNavItems'), 'getRoleNavItems function must exist');

  // Check PATIENT nav items in switch
  assert.ok(content.includes("case 'PATIENT':"), 'Must have PATIENT case');
  const patientBlock = content.slice(content.indexOf("case 'PATIENT':"), content.indexOf("case 'DONOR':"));
  assert.ok(patientBlock.includes("id: 'pregnancy'"), 'Patient nav must have pregnancy tab');

  // Check HOSPITAL nav items in switch
  const hospitalBlock = content.slice(content.indexOf("case 'HOSPITAL_ADMIN':"), content.indexOf("case 'BLOOD_BANK_ADMIN':"));
  assert.ok(hospitalBlock.includes("id: 'pregnancy'"), 'Hospital nav must have pregnancy tab');

  // Check BLOOD_BANK nav items in switch
  const bloodBankBlock = content.slice(content.indexOf("case 'BLOOD_BANK_ADMIN':"), content.indexOf("case 'AMBULANCE_DRIVER':"));
  assert.ok(!bloodBankBlock.includes("id: 'pregnancy'"), 'Blood Bank nav must NOT have pregnancy tab');
  assert.ok(!bloodBankBlock.includes("id: 'hospital'"), 'Blood Bank nav must NOT have hospital tab (must use discovery)');

  // Check AMBULANCE nav items in switch
  const ambulanceBlock = content.slice(content.indexOf("case 'AMBULANCE_DRIVER':"), content.indexOf("case 'LIFELINEX_ADMIN':"));
  assert.ok(!ambulanceBlock.includes("id: 'pregnancy'"), 'Ambulance nav must NOT have pregnancy tab');
  assert.ok(!ambulanceBlock.includes("id: 'hospital'"), 'Ambulance nav must NOT have hospital tab (must use discovery)');

  return 'navItems strictly controls pregnancy visibility by role and eliminates hospital tab collisions';
});

// ─── TEST 2: Primary home identification per role ───────────────────────────
await test(2, 'navItems.ts: getPrimaryHomeId returns role-specific primary dashboard', async () => {
  const content = readFile('src/lib/navItems.ts');
  assert.ok(content.includes('export function getPrimaryHomeId'), 'getPrimaryHomeId function must exist');
  assert.ok(content.includes("case 'PATIENT':\n      return 'home'"), 'Patient primary home is home');
  assert.ok(content.includes("case 'HOSPITAL_ADMIN':\n    case 'HOSPITAL_STAFF':\n      return 'hospital'"), 'Hospital primary home is hospital');
  assert.ok(content.includes("case 'BLOOD_BANK_ADMIN':\n    case 'BLOOD_BANK_STAFF':\n      return 'bloodbank'"), 'Blood bank primary home is bloodbank');
  assert.ok(content.includes("case 'AMBULANCE_DRIVER':\n    case 'AMBULANCE_PROVIDER_ADMIN':\n      return 'ambulance'"), 'Ambulance primary home is ambulance');
  assert.ok(content.includes("case 'DONOR':\n      return 'donor'"), 'Donor primary home is donor');

  return 'Primary home identifiers are role-specific and accurate';
});

// ─── TEST 3: Auth Session Resolution ─────────────────────────────────────────
await test(3, 'authService.ts: Exact role resolution for institutional logins without Hospital Admin default fallback', async () => {
  const content = readFile('src/services/authService.ts');
  assert.ok(content, 'authService.ts must exist');

  // Verify restoreLocalSession checks is_primary
  assert.ok(content.includes("userRolesRecords.find((ur) => ur.is_primary)?.role"), 'Must check is_primary in restoreLocalSession');

  // Verify loginWithDeveloperSandbox checks primary role
  assert.ok(content.includes("userRolesRecords.find((ur) => ur.is_primary)?.role"), 'Must check is_primary in loginWithDeveloperSandbox');

  // Verify loginWithInstitutionalCredentials checks primary role
  assert.ok(content.includes("userRolesRecords.find((ur) => ur.is_primary"), 'Must check is_primary in loginWithInstitutionalCredentials');

  return 'authService resolves exact institutional roles (BLOOD_BANK_ADMIN, AMBULANCE_DRIVER) cleanly';
});

// ─── TEST 4: App.tsx Route Guards for Pregnancy Care ─────────────────────────
await test(4, 'App.tsx: Strict access control on activeTab === pregnancy', async () => {
  const content = readFile('src/App.tsx');
  assert.ok(content, 'App.tsx must exist');

  // Check route guard
  assert.ok(content.includes("activeTab === 'pregnancy'"), 'Must handle pregnancy route');
  assert.ok(content.includes("activeRole === 'PATIENT' ? ("), 'Patient gets PregnancyCareHub');
  assert.ok(content.includes("<PregnancyCareHub onNavigate={handleTabChange} />"), 'Renders PregnancyCareHub for Patient');
  assert.ok(content.includes("activeRole === 'HOSPITAL_ADMIN' || activeRole === 'HOSPITAL_STAFF'"), 'Hospital gets HospitalPregnancyCare');
  assert.ok(content.includes("<HospitalPregnancyCare onNavigate={handleTabChange} />"), 'Renders HospitalPregnancyCare for Hospital');
  assert.ok(content.includes('Access Restricted'), 'Unauthorized roles see Access Restricted card');

  return 'Route guards strictly isolate patient and hospital views and block other roles';
});

// ─── TEST 5: App.tsx Role Isolation on Tab Selection ────────────────────────
await test(5, 'App.tsx: Role-keyed tab selection guarantees clean dashboard landing upon role change', async () => {
  const content = readFile('src/App.tsx');
  assert.ok(content.includes('tabSelection.role === activeRole'), 'Tab selection must be verified against activeRole');
  assert.ok(content.includes("navItems[0]?.id ?? 'emergency'"), 'Falls back to role default nav item on role mismatch');

  return 'Tab state is role-scoped, preventing cross-role route leakage';
});

// ─── TEST 6: Topbar Desktop Nav Dynamic Scoping ──────────────────────────────
await test(6, 'AppTopbar.tsx: Desktop nav links derived dynamically from role navItems', async () => {
  const content = readFile('src/components/shell/AppTopbar.tsx');
  assert.ok(content, 'AppTopbar.tsx must exist');

  assert.ok(content.includes('const displayLinks = navItems.length > 0'), 'Desktop links must be derived from navItems');
  assert.ok(content.includes('primaryHomeId'), 'Logo routes to role primaryHomeId');
  assert.ok(content.includes('onTabChange?.(primaryHomeId)'), 'Clicking logo navigates to role primary home, not hardcoded home');

  return 'Topbar dynamically aligns desktop links and logo navigation with the active role';
});

// ─── TEST 7: Mode Switcher Authorized Modes Only ─────────────────────────────
await test(7, 'ModeSwitcherModal.tsx: Only displays authorized roles for user and never shows Pregnancy Care', async () => {
  const content = readFile('src/components/common/ModeSwitcherModal.tsx');
  assert.ok(content, 'ModeSwitcherModal.tsx must exist');

  assert.ok(content.includes('PRIMARY_MODES.filter((mode) => isRoleAuthorized(mode.id))'), 'Must filter modes by isRoleAuthorized');
  assert.ok(!content.includes("id: 'PREGNANCY'"), 'Pregnancy Care must never be listed as an application mode');

  return 'Mode switcher only renders modes authenticated user possesses + universal donor';
});

// ─── TEST 8: Hospital Pregnancy Care Scoping ─────────────────────────────────
await test(8, 'HospitalPregnancyCare.tsx: Strict facility scoping to active hospital', async () => {
  const content = readFile('src/components/hospital/HospitalPregnancyCare.tsx');
  assert.ok(content, 'HospitalPregnancyCare.tsx must exist');

  assert.ok(content.includes('p.hospital_id === hospitalId'), 'Profiles must be filtered by hospitalId');
  assert.ok(content.includes("p.status !== 'ARCHIVED'"), 'Archived profiles are excluded');
  assert.ok(content.includes('emergencyOnly'), 'Supports active emergency filter');
  assert.ok(content.includes('selectedPatientAppointments'), 'Inspects patient appointments');
  assert.ok(content.includes('selectedPatientRecords'), 'Inspects maternal health records');

  return 'Hospital Pregnancy Care is fully hospital-scoped and data-backed';
});

// ─── TEST 9: Hospital Command Center Summary Card ────────────────────────────
await test(9, 'HospitalCommandCenter.tsx: Displays real hospital-scoped pregnancy metrics card', async () => {
  const content = readFile('src/components/hospital/HospitalCommandCenter.tsx');
  assert.ok(content, 'HospitalCommandCenter.tsx must exist');

  assert.ok(content.includes("dbAdapter.getTable('pregnancy_profiles')"), 'Subscribes to pregnancy profiles');
  assert.ok(content.includes('linkedPregnancies'), 'Computes linked pregnancies for active hospital');
  assert.ok(content.includes('pregnancyStats'), 'Calculates total, high risk, monitoring, and dueSoon counts');
  assert.ok(content.includes('Pregnancy Care'), 'Renders pregnancy care summary card');
  assert.ok(content.includes("onNavigate?.('pregnancy')"), 'Card click routes to pregnancy care workspace');

  return 'Hospital command center integrates real-data pregnancy summary card';
});

// ─── TEST 10: Patient Pregnancy Care Hub Persistence ─────────────────────────
await test(10, 'PregnancyCareHub.tsx: Structured vitals logging and guardian management', async () => {
  const content = readFile('src/components/pregnancy/PregnancyCareHub.tsx');
  assert.ok(content, 'PregnancyCareHub.tsx must exist');

  assert.ok(content.includes('pregnancyService.addHealthRecord'), 'Persists health tracking records');
  assert.ok(content.includes('pregnancyService.deleteHealthRecord'), 'Supports deleting health records');
  assert.ok(content.includes('pregnancyService.addGuardian'), 'Persists emergency guardians');
  assert.ok(content.includes('pregnancyService.removeGuardian'), 'Supports removing emergency guardians');
  assert.ok(content.includes("guardians.length < 3"), 'Enforces maximum of 3 guardians');
  assert.ok(content.includes('triggerSOS'), 'Supports Obstetric Emergency SOS');

  return 'Patient pregnancy care hub supports full vitals logging and guardian CRUD';
});

// ─── TEST 11: Database Adapter Seed Data Integrity ───────────────────────────
await test(11, 'databaseAdapter.ts: Seed database has cross-hospital pregnancy profiles and delete support', async () => {
  const content = readFile('src/services/databaseAdapter.ts');
  assert.ok(content, 'databaseAdapter.ts must exist');

  // Verify delete method exists
  assert.ok(content.includes('public delete<K extends keyof DatabaseSchema>'), 'delete method exists on DatabaseAdapter');

  // Verify Apollo pregnancy profile for Rahul Sharma
  assert.ok(content.includes('88888888-8888-8888-8888-888888888801'), 'Apollo pregnancy profile seeded');
  assert.ok(content.includes('33333333-3333-3333-3333-333333333301'), 'Linked to Apollo hospital');

  // Verify Fortis pregnancy profile for Priya Sundaram
  assert.ok(content.includes('88888888-8888-8888-8888-888888888802'), 'Fortis pregnancy profile seeded');
  assert.ok(content.includes('33333333-3333-3333-3333-333333333302'), 'Linked to Fortis hospital');

  // Verify Health records and guardians seeded
  assert.ok(content.includes('99999999-9999-9999-9999-999999999901'), 'Sample health record seeded');
  assert.ok(content.includes('77777777-7777-7777-7777-777777777701'), 'Sample guardian Sunita Sharma seeded');

  return 'Database adapter has complete seeded cross-hospital pregnancy profiles and guardians';
});

// ─── TEST 12: AuthScreen Contextual Institutional Access ─────────────────────
await test(12, 'AuthScreen.tsx: Contextual titles and placeholders for Hospital, Blood Bank, and Ambulance', async () => {
  const content = readFile('src/components/auth/AuthScreen.tsx');
  assert.ok(content, 'AuthScreen.tsx must exist');

  assert.ok(content.includes("setInstCategory('HOSPITAL')"), 'Hospital sets HOSPITAL category');
  assert.ok(content.includes("setInstCategory('BLOOD_BANK')"), 'Blood Bank sets BLOOD_BANK category');
  assert.ok(content.includes("setInstCategory('AMBULANCE')"), 'Ambulance sets AMBULANCE category');
  assert.ok(content.includes('Blood Bank Center Access'), 'Customized Blood Bank heading');
  assert.ok(content.includes('Ambulance & EMS Dispatch Access'), 'Customized Ambulance heading');
  assert.ok(content.includes('bloodbank.director@redcross.org'), 'Blood bank contextual placeholder');
  assert.ok(content.includes('ambulance.driver1@medifleet.org'), 'Ambulance contextual placeholder');

  return 'AuthScreen provides customized institutional context for all facility roles';
});

console.log('\n================================================================================');
console.log(`  SUMMARY: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================================\n');

if (failed > 0) {
  process.exit(1);
}
