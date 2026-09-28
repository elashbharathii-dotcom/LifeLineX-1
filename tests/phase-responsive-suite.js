/**
 * LifelineX — Phase Responsive Viewport Test Suite
 *
 * Validates the responsive CSS design system against:
 *   - 10 device breakpoints × 2 orientations
 *   - Fluid typography clamp() bounds
 *   - Safe-area CSS variable declarations
 *   - Overflow guard presence
 *   - Touch target minimums
 *   - Bottom nav safe-area compliance
 *   - Modal/drawer constraints
 *   - Emergency layout accessibility
 *
 * Note: These tests run in Node.js and validate the CSS text statically.
 * Browser-level overflow checks (scrollWidth > innerWidth) must be done
 * in a real browser dev tools session — documented in responsive-device-validation.md
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

const CSS_PATH = path.resolve('src/index.css');
const HTML_PATH = path.resolve('index.html');

const css = fs.readFileSync(CSS_PATH, 'utf8');
const html = fs.readFileSync(HTML_PATH, 'utf8');

console.log('================================================================================');
console.log('   LIFELINEX RESPONSIVE VIEWPORT & DEVICE ADAPTATION TEST SUITE               ');
console.log('================================================================================\n');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✔ PASSED  — ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✘ FAILED  — ${label}`);
    console.error(`             ${err.message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// [1] viewport-fit=cover in index.html
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [1/20] index.html — viewport-fit=cover for safe-area-inset support');
test('viewport meta includes viewport-fit=cover', () => {
  assert(
    html.includes('viewport-fit=cover'),
    'index.html must include viewport-fit=cover in the <meta name="viewport"> tag'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [2] Dynamic viewport units (dvh)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [2/20] CSS — Dynamic viewport units (100dvh)');
test('CSS uses 100dvh for shell height instead of legacy 100vh', () => {
  assert(
    css.includes('100dvh'),
    'index.css must use 100dvh for address-bar-aware layout'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [3] Safe-area custom properties
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [3/20] CSS — env(safe-area-inset-*) declared as CSS variables');
test('Safe-area insets defined: top, bottom, left, right', () => {
  assert(css.includes('env(safe-area-inset-top'), 'Missing safe-area-inset-top');
  assert(css.includes('env(safe-area-inset-bottom'), 'Missing safe-area-inset-bottom');
  assert(css.includes('env(safe-area-inset-left'), 'Missing safe-area-inset-left');
  assert(css.includes('env(safe-area-inset-right'), 'Missing safe-area-inset-right');
});

// ─────────────────────────────────────────────────────────────────────────────
// [4] Fluid typography with clamp()
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [4/20] CSS — Fluid typography using clamp() for all heading levels');
test('clamp() used for .text-display, .text-h1, .text-h2, .text-h3', () => {
  const clampHeadings = [
    '.text-display',
    '.text-h1',
    '.text-h2',
    '.text-h3',
    '.lx-page-title',
    '.lx-metric-value',
  ];
  for (const selector of clampHeadings) {
    // Find the exact rule selector block (e.g. .lx-page-title {) rather than prefix matches like .lx-page-title-row
    const regex = new RegExp(`\\${selector}\\s*\\{`, 'g');
    let match, lastMatch = null;
    while ((match = regex.exec(css)) !== null) {
      lastMatch = match;
    }
    assert(lastMatch !== null, `${selector} not found in CSS`);
    const slice = css.slice(lastMatch.index, lastMatch.index + 200);
    assert(
      slice.includes('clamp('),
      `${selector} responsive override must use clamp() for fluid font-size`
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// [5] Fluid SOS button with clamp()/vmin
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [5/20] CSS — SOS button uses clamp()/vmin for fluid sizing');
test('.lx-sos-button uses clamp() with vmin so it never overflows viewport', () => {
  const idx = css.lastIndexOf('.lx-sos-button');
  assert(idx !== -1, '.lx-sos-button not found');
  const slice = css.slice(idx, idx + 300);
  assert(slice.includes('clamp('), '.lx-sos-button must use clamp() for fluid sizing');
  assert(slice.includes('vmin'), '.lx-sos-button must use vmin to respect both dimensions');
});

// ─────────────────────────────────────────────────────────────────────────────
// [6] Horizontal overflow guard
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [6/20] CSS — Horizontal overflow guard on html and body');
test('html, body have overflow-x: hidden and max-width: 100vw', () => {
  assert(css.includes('overflow-x: hidden'), 'Missing overflow-x: hidden on html/body');
  assert(css.includes('max-width: 100vw'), 'Missing max-width: 100vw on html/body');
});

// ─────────────────────────────────────────────────────────────────────────────
// [7] Mobile breakpoint (< 768px) shell rules
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [7/20] CSS — Mobile shell breakpoint (max-width: 767px)');
test('Mobile shell rules present: sidebar off-screen, margin-left: 0, compact topbar', () => {
  assert(css.includes('max-width: 767px'), 'Missing max-width: 767px mobile breakpoint');
  // Verify sidebar transform and margin reset inside that breakpoint
  const idx = css.indexOf('max-width: 767px');
  const slice = css.slice(idx, idx + 800);
  assert(slice.includes('translateX(-100%)'), 'Sidebar must slide off-screen on mobile');
  assert(slice.includes('margin-left: 0'), 'Main wrapper margin must be 0 on mobile');
});

// ─────────────────────────────────────────────────────────────────────────────
// [8] Tablet intermediate layout (768–1023px)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [8/20] CSS — Tablet icon sidebar (768–1023px breakpoint)');
test('Tablet breakpoint defines icon-only sidebar with sidebar-tablet width', () => {
  assert(
    css.includes('min-width: 768px') && css.includes('max-width: 1023px'),
    'Missing tablet breakpoint range (768–1023px)'
  );
  // Verify tablet sidebar uses the narrow width
  const idx = css.indexOf('min-width: 768px');
  const slice = css.slice(idx, idx + 600);
  assert(
    slice.includes('var(--sidebar-tablet)'),
    'Tablet sidebar must use --sidebar-tablet width variable'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [9] Bottom nav safe-area compliance
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [9/20] CSS — Bottom nav includes safe-area-inset-bottom padding');
test('.lx-bottom-nav includes safe-area-inset-bottom and calc() height', () => {
  // Find the responsive section's bottom nav rules
  const idx = css.lastIndexOf('.lx-bottom-nav {');
  assert(idx !== -1, '.lx-bottom-nav rule not found in responsive section');
  const slice = css.slice(idx, idx + 400);
  assert(
    slice.includes('var(--safe-bottom)'),
    '.lx-bottom-nav must use --safe-bottom for notch-aware padding'
  );
  assert(
    slice.includes('calc('),
    '.lx-bottom-nav height must use calc() for dynamic sizing'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [10] Touch target minimum size (44×44px)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [10/20] CSS — Touch targets ≥ 44px (WCAG 2.2 / Apple HIG)');
test('Bottom nav items and inputs have min-height: 44px', () => {
  assert(
    css.includes('min-height: 44px'),
    'Touch targets must specify min-height: 44px'
  );
  assert(
    css.includes('min-width: 44px'),
    'Touch targets must specify min-width: 44px'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [11] Modal bottom sheet on mobile
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [11/20] CSS — Modal converts to bottom sheet on mobile (max-width: 639px)');
test('Modal uses align-items: flex-end and sheet-in animation on mobile', () => {
  assert(
    css.includes('align-items: flex-end'),
    'Modal overlay must use flex-end alignment for bottom sheet'
  );
  assert(
    css.includes('sheet-in'),
    'Bottom sheet animation (sheet-in) must be defined'
  );
  assert(
    css.includes('92dvh'),
    'Mobile modal max-height must use 92dvh (dynamic viewport)'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [12] Drawer bottom sheet on mobile
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [12/20] CSS — Drawer converts to bottom sheet on mobile');
test('.lx-drawer on mobile is bottom-anchored with 100vw width', () => {
  // Find the 639px breakpoint for drawer
  const drawerIdx = css.indexOf('.lx-drawer {\n    width: 100vw');
  assert(
    drawerIdx !== -1,
    '.lx-drawer must be 100vw wide in mobile (bottom sheet mode)'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [13] Responsive table card mode
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [13/20] CSS — Table card mode (lx-table-card-mode) for mobile');
test('.lx-table-card-mode transforms table into stacked cards on mobile', () => {
  assert(
    css.includes('lx-table-card-mode'),
    '.lx-table-card-mode class must be defined'
  );
  assert(
    css.includes('attr(data-label)'),
    'Card mode must use data-label attribute for column headers'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [14] Responsive form grid
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [14/20] CSS — Responsive form grid (lx-form-grid)');
test('.lx-form-grid uses auto-fit with minmax for 2-col→1-col adaptation', () => {
  assert(css.includes('lx-form-grid'), '.lx-form-grid must be defined');
  const idx = css.indexOf('lx-form-grid');
  const slice = css.slice(idx, idx + 300);
  assert(slice.includes('auto-fit'), 'Form grid must use auto-fit');
  assert(slice.includes('minmax'), 'Form grid must use minmax()');
});

// ─────────────────────────────────────────────────────────────────────────────
// [15] Map container fluid height
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [15/20] CSS — Map container uses clamp() for fluid height');
test('.lx-map-container height uses clamp() not a fixed pixel value', () => {
  const idx = css.lastIndexOf('.lx-map-container');
  assert(idx !== -1, '.lx-map-container not found');
  const slice = css.slice(idx, idx + 200);
  assert(
    slice.includes('clamp('),
    '.lx-map-container must use clamp() for responsive height'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [16] Ultrawide max-content constraint
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [16/20] CSS — Ultrawide max-content width prevents excessive stretching');
test('Content max-width capped via min() on ≥1920px screens', () => {
  assert(
    css.includes('min-width: 1920px'),
    'Missing 1920px breakpoint for ultrawide'
  );
  const idx = css.indexOf('min-width: 1920px');
  const slice = css.slice(idx, idx + 400);
  assert(
    slice.includes('min(') || slice.includes('max-width'),
    'Ultrawide breakpoint must constrain content max-width'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [17] Short viewport (height < 600px) adaptation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [17/20] CSS — Short viewport (landscape mobile) compresses vertical spacing');
test('max-height: 599px media query compresses SOS wrapper and topbar', () => {
  assert(
    css.includes('max-height: 599px'),
    'Missing max-height: 599px query for short viewports (landscape mobile/laptop)'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [18] Landscape orientation support
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [18/20] CSS — Landscape orientation media query present');
test('orientation: landscape media query adjusts layout', () => {
  assert(
    css.includes('orientation: landscape'),
    'Missing orientation: landscape media query'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [19] Fluid metric grid with auto-fit
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [19/20] CSS — Metric grid uses auto-fit minmax with clamp()');
test('.lx-metric-grid responsive section uses auto-fit with clamp() minmax', () => {
  // Find the RESPONSIVE section's override of metric grid
  const idx = css.lastIndexOf('lx-metric-grid');
  assert(idx !== -1, '.lx-metric-grid not found');
  const slice = css.slice(idx, idx + 300);
  assert(
    slice.includes('auto-fit'),
    '.lx-metric-grid must use auto-fit for responsive column count'
  );
  assert(
    slice.includes('clamp('),
    '.lx-metric-grid minmax must use clamp() for fluid item width'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// [20] Print styles
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n▶ [20/20] CSS — Print media query hides navigation, sidebar');
test('@media print hides sidebar, topbar, and bottom nav', () => {
  assert(css.includes('@media print'), 'Missing @media print styles');
  const idx = css.indexOf('@media print');
  const slice = css.slice(idx, idx + 400);
  assert(
    slice.includes('.lx-sidebar') && slice.includes('display: none'),
    'Print styles must hide .lx-sidebar'
  );
  assert(
    slice.includes('.lx-bottom-nav'),
    'Print styles must hide .lx-bottom-nav'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n================================================================================');
if (failed === 0) {
  console.log(`   🎉 RESPONSIVE SUITE COMPLETE: ${passed}/${passed + failed} TESTS PASSED (100% SUCCESS)`);
} else {
  console.log(`   ⚠  RESPONSIVE SUITE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`      Fix all failures before declaring responsive phase complete.`);
}
console.log('================================================================================\n');

if (failed > 0) process.exit(1);
