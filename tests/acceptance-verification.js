import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('  LIFELINEX: SURGICAL REMOVAL ACCEPTANCE VERIFICATION SUITE                    ');
console.log('================================================================================\n');

let passed = 0;
let failed = 0;

const runTest = (title, fn) => {
  process.stdout.write(`▶ ${title}... `);
  try {
    fn();
    passed++;
    console.log('✔ PASSED');
  } catch (err) {
    failed++;
    console.log(`❌ FAILED: ${err.message}`);
  }
};

const readFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

// TEST 1: ModeSwitcherModal Blocking Fix
runTest('TEST 1: ModeSwitcherModal has explicit if (!isOpen) return null guard', () => {
  const code = readFile('src/components/common/ModeSwitcherModal.tsx');
  assert.ok(code.includes('if (!isOpen) return null;'), 'Must have if (!isOpen) return null;');
  assert.ok(!code.includes('StateSupervisorProvisioningModal'), 'Must not import or render StateSupervisorProvisioningModal');
  assert.ok(!code.includes('State Supervisor Authority Active'), 'Must not have supervisor banner');
});

// TEST 2: App Shell Supervisor Route Removal
runTest('TEST 2: App.tsx has no supervisor imports, routes, or tabs', () => {
  const code = readFile('src/App.tsx');
  assert.ok(!code.includes('StateSupervisorGuard'), 'Must not import StateSupervisorGuard');
  assert.ok(!code.includes('StateSupervisorDashboard'), 'Must not import StateSupervisorDashboard');
  assert.ok(!code.includes("currentPath.startsWith('/state-supervisor')"), 'Must not have /state-supervisor route');
  assert.ok(!code.includes("activeRole === 'STATE_SUPERVISOR'"), 'Must not render STATE_SUPERVISOR tab');
});

// TEST 3: Auth System - No Supervisor Provisioning or Approval
runTest('TEST 3: authService & AuthContext have no supervisor methods', () => {
  const authCode = readFile('src/services/authService.ts');
  const contextCode = readFile('src/context/AuthContext.tsx');
  assert.ok(!authCode.includes('acceptSupervisorInvitation'), 'authService must not have acceptSupervisorInvitation');
  assert.ok(!authCode.includes('getInstitutionalInvitations'), 'authService must not have getInstitutionalInvitations');
  assert.ok(!contextCode.includes('acceptSupervisorInvitation'), 'AuthContext must not have acceptSupervisorInvitation');
});

// TEST 4: Database Safety - No Supervisor Seeds
runTest('TEST 4: databaseAdapter has no supervisor profile or supervisor role seed', () => {
  const dbCode = readFile('src/services/databaseAdapter.ts');
  assert.ok(!dbCode.includes('supervisor.tamilnadu@health.gov.in'), 'Must not have supervisor profile seed');
  assert.ok(!dbCode.includes('ur-supervisor'), 'Must not have ur-supervisor role seed');
  assert.ok(!dbCode.includes('institutional_invitations'), 'Must not have institutional_invitations table');
});

// TEST 5: Type Safety - STATE_SUPERVISOR Removed
runTest('TEST 5: database.ts does not include STATE_SUPERVISOR in UserRoleType', () => {
  const typesCode = readFile('src/types/database.ts');
  assert.ok(!typesCode.includes("'STATE_SUPERVISOR'"), 'UserRoleType must not include STATE_SUPERVISOR');
  assert.ok(!typesCode.includes('SupervisorDashboardMetrics'), 'Must not have SupervisorDashboardMetrics');
  assert.ok(!typesCode.includes('InstitutionalInvitationRecord'), 'Must not have InstitutionalInvitationRecord');
});

// TEST 6: Navigation Items Cleaned
runTest('TEST 6: navItems.ts has no STATE_SUPERVISOR case', () => {
  const navCode = readFile('src/lib/navItems.ts');
  assert.ok(!navCode.includes("case 'STATE_SUPERVISOR':"), 'Must not have case STATE_SUPERVISOR');
});

// TEST 7: Role Switcher Cleaned
runTest('TEST 7: RoleSwitcher.tsx has no STATE_SUPERVISOR role', () => {
  const roleCode = readFile('src/components/common/RoleSwitcher.tsx');
  assert.ok(!roleCode.includes('STATE_SUPERVISOR'), 'Must not have STATE_SUPERVISOR');
});

// TEST 8: Blood Bank Admin Persona and Dashboard Modules Preserved
runTest('TEST 8: Blood Bank Admin profile and command center modules intact', () => {
  const dbCode = readFile('src/services/databaseAdapter.ts');
  const navCode = readFile('src/lib/navItems.ts');
  assert.ok(dbCode.includes('BLOOD_BANK_ADMIN'), 'Must preserve BLOOD_BANK_ADMIN role');
  assert.ok(navCode.includes('Inventory Command'), 'Must preserve Inventory Command');
  assert.ok(navCode.includes('Critical SOS Calls'), 'Must preserve Critical SOS Calls');
  assert.ok(navCode.includes('Donor Roster & Chains'), 'Must preserve Donor Roster & Chains');
  assert.ok(navCode.includes('Collection Camps'), 'Must preserve Collection Camps');
  assert.ok(navCode.includes('Cold-Chain Map'), 'Must preserve Cold-Chain Map');
  assert.ok(navCode.includes('Hospital Allocations'), 'Must preserve Hospital Allocations');
});

// TEST 9: Files Exclusively for Supervisor Deleted
runTest('TEST 9: State Supervisor dedicated files are completely deleted', () => {
  const deletedFiles = [
    'src/services/stateSupervisorService.ts',
    'src/components/admin/StateSupervisorGuard.tsx',
    'src/components/admin/StateSupervisorDashboard.tsx',
    'src/components/admin/StateSupervisorProvisioningModal.tsx',
    'supabase/migrations/20260902000008_state_supervisor_and_invitations.sql',
    'tests/phase-state-supervisor-suite.js',
  ];
  for (const f of deletedFiles) {
    assert.ok(!fs.existsSync(path.join(ROOT, f)), `File must be deleted: ${f}`);
  }
});

console.log('\n================================================================================');
console.log(`  RESULTS: ${passed} PASSED / ${failed} FAILED`);
console.log('================================================================================\n');

if (failed > 0) {
  process.exit(1);
}
