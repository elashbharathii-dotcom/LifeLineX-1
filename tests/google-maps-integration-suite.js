import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================================');
console.log('  LIFELINEX: GOOGLE MAPS INTEGRATION VERIFICATION SUITE                         ');
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

// TEST 1: Service Architecture & Separation of Concerns
runTest('TEST 1: Shared Map Services architecture exists and is provider-agnostic', () => {
  const mapTypes = readFile('src/services/maps/mapTypes.ts');
  const mapService = readFile('src/services/maps/MapService.ts');
  const routeService = readFile('src/services/maps/RouteService.ts');
  const geocodingService = readFile('src/services/maps/GeocodingService.ts');
  const mapPrivacyService = readFile('src/services/maps/MapPrivacyService.ts');
  const loader = readFile('src/services/maps/googleMapsLoader.ts');

  assert.ok(mapTypes.includes('export interface MapCoordinates'), 'mapTypes must define MapCoordinates');
  assert.ok(mapTypes.includes('export interface RouteResult'), 'mapTypes must define RouteResult');
  assert.ok(mapTypes.includes('export interface MapMarkerDescriptor'), 'mapTypes must define MapMarkerDescriptor');
  assert.ok(mapTypes.includes('export interface MapRouteDescriptor'), 'mapTypes must define MapRouteDescriptor');

  assert.ok(mapService.includes('class MapService'), 'MapService facade must exist');
  assert.ok(routeService.includes('class RouteService'), 'RouteService must exist');
  assert.ok(geocodingService.includes('class GeocodingService'), 'GeocodingService must exist');
  assert.ok(mapPrivacyService.includes('class MapPrivacyService'), 'MapPrivacyService must exist');
  assert.ok(loader.includes('class GoogleMapsLoader'), 'googleMapsLoader must export singleton loader');
});

// TEST 2: Security & No Hardcoded Secrets
runTest('TEST 2: Zero hardcoded API keys in source files and strict gitignore enforcement', () => {
  const gitignore = readFile('.gitignore');
  assert.ok(gitignore.includes('.env.local'), '.gitignore must ignore .env.local');
  assert.ok(gitignore.includes('.env.*.local'), '.gitignore must ignore .env.*.local');

  const envExample = readFile('.env.example');
  assert.ok(envExample.includes('VITE_GOOGLE_MAPS_API_KEY='), '.env.example must document VITE_GOOGLE_MAPS_API_KEY');

  // Search src/ for suspicious key patterns
  const scanDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        scanDir(full);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf-8');
        assert.ok(
          !content.includes('AIzaSy'),
          `Source file ${full} contains a hardcoded Google API key pattern (AIzaSy...)`
        );
      }
    }
  };
  scanDir(path.join(ROOT, 'src'));
});

// TEST 3: All 6 Map Views Integrated with GoogleMapContainer
runTest('TEST 3: All 6 Map Views use GoogleMapContainer & MapService RBAC sanitization', () => {
  const maps = [
    { file: 'src/components/maps/PatientMap.tsx', role: 'PATIENT' },
    { file: 'src/components/maps/HospitalMap.tsx', role: 'HOSPITAL_ADMIN' },
    { file: 'src/components/maps/AmbulanceMap.tsx', role: 'AMBULANCE_DRIVER' },
    { file: 'src/components/maps/BloodBankMap.tsx', role: 'BLOOD_BANK_ADMIN' },
    { file: 'src/components/maps/DonorMap.tsx', role: 'DONOR' },
    { file: 'src/components/maps/AdminMap.tsx', role: 'LIFELINEX_ADMIN' },
  ];

  for (const { file, role } of maps) {
    const code = readFile(file);
    assert.ok(code.includes('GoogleMapContainer'), `${file} must import and use GoogleMapContainer`);
    assert.ok(!code.includes('LeafletMapContainer'), `${file} must not use LeafletMapContainer`);
    assert.ok(code.includes('mapService.sanitizeMarkers'), `${file} must sanitize markers via mapService`);
    assert.ok(code.includes(`'${role}'`), `${file} must pass ${role} role to sanitizeMarkers`);
  }
});

// TEST 4: GoogleMapContainer Resilient UX States (Loading, Error, Unconfigured, Offline, Empty)
runTest('TEST 4: GoogleMapContainer implements all required professional states without fake tiles', () => {
  const containerCode = readFile('src/components/maps/GoogleMapContainer.tsx');

  assert.ok(containerCode.includes('Loading map'), 'Must handle Loading state ("Loading map...")');
  assert.ok(containerCode.includes("You're offline."), 'Must handle Offline state ("You\'re offline.")');
  assert.ok(containerCode.includes('Map service is not configured.'), 'Must handle Unconfigured state ("Map service is not configured.")');
  assert.ok(containerCode.includes('Unable to load map.'), 'Must handle Error state ("Unable to load map.")');
  assert.ok(containerCode.includes('handleRetry'), 'Must provide retry handler on error');
  assert.ok(!containerCode.includes('tile.openstreetmap.org') && !containerCode.includes('fake-map'), 'Must not render fake map tiles when unconfigured');
});

// TEST 5: Healthcare & RBAC Privacy Rules in MapPrivacyService
runTest('TEST 5: MapPrivacyService applies ~800m privacy jitter and circle to donor homes', () => {
  const privacyCode = readFile('src/services/maps/MapPrivacyService.ts');
  assert.ok(privacyCode.includes('getBlurredCoordinates'), 'Must implement donor coordinate blurring algorithm');
  assert.ok(privacyCode.includes('isPrivacyBlurred: true'), 'Must flag blurred donor markers with privacy flag');
  assert.ok(privacyCode.includes('radiusMeters: 800'), 'Must enforce ~800m radius privacy circle');
  assert.ok(privacyCode.includes('sanitizeMarkerForViewer'), 'Must implement RBAC marker sanitization');
});

// TEST 6: Route Service Fallbacks Without Fake ETAs
runTest('TEST 6: RouteService calculates distances with clear fallback indicators (no fake ETAs)', () => {
  const routeCode = readFile('src/services/maps/RouteService.ts');
  assert.ok(routeCode.includes('calculateHaversineDistanceKm'), 'Must implement mathematical Haversine distance fallback');
  assert.ok(routeCode.includes('isFallbackEstimate: true'), 'Fallback route must be explicitly flagged as isFallbackEstimate');
  assert.ok(routeCode.includes('Direct line distance shown'), 'Fallback route must display honest disclaimer');
});

console.log('\n--------------------------------------------------------------------------------');
console.log(`SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('--------------------------------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL GOOGLE MAPS INTEGRATION ACCEPTANCE CHECKS PASSED!\n');
}
