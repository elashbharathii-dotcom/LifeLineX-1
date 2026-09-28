import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA = path.join(process.cwd(), 'node_modules', '.tmp_edge_test_profile');

if (!fs.existsSync(USER_DATA)) {
  fs.mkdirSync(USER_DATA, { recursive: true });
}

console.log('Launching headless Edge for LifelineX Pregnancy Mode & UI verification...');
const edge = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9224',
  `--user-data-dir=${USER_DATA}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-fre',
  '--disable-sync',
  '--inprivate',
  'http://localhost:5173'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await sleep(2500);

  try {
    const res = await fetch('http://127.0.0.1:9224/json');
    const tabs = await res.json();
    const pageTab = tabs.find((t) => t.type === 'page');

    if (!pageTab || !pageTab.webSocketDebuggerUrl) {
      console.error('No page tab with webSocketDebuggerUrl found:', tabs);
      edge.kill();
      process.exit(1);
    }

    console.log('Connected to Edge CDP at:', pageTab.webSocketDebuggerUrl);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => {
      const msgId = id++;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return msgId;
    };

    const evalInPage = (code, ...args) => {
      return new Promise((resolve) => {
        const argStr = args.length ? `, ...${JSON.stringify(args)}` : '';
        const msgId = send('Runtime.evaluate', {
          expression: `(${code})(${argStr.slice(2)})`,
          returnByValue: true,
          awaitPromise: true,
        });
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(data.result?.result?.value);
          }
        };
        ws.addEventListener('message', handler);
      });
    };

    const errors = [];
    const uncaughtExceptions = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const type = data.params.type;
        const text = (data.params.args || []).map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
        if (type === 'error') {
          console.error(`  [CONSOLE ERROR]:`, text);
          errors.push(text);
        }
      } else if (data.method === 'Runtime.exceptionThrown') {
        const desc = data.params.exceptionDetails?.exception?.description || JSON.stringify(data.params.exceptionDetails);
        console.error(`  🔴 [EXCEPTION]:`, desc);
        uncaughtExceptions.push(desc);
      }
    };

    ws.onopen = async () => {
      send('Runtime.enable');
      send('Console.enable');
      send('Page.enable');

      send('Page.navigate', { url: 'http://localhost:5173' });
      await sleep(2500);

      // Authenticate if needed
      console.log('Checking AuthScreen & Persona Login...');
      await evalInPage(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const sandboxBtn = buttons.find((b) => b.textContent && b.textContent.includes('Developer Test Sandbox'));
        if (sandboxBtn) {
          sandboxBtn.click();
        }
      });
      await sleep(800);

      await evalInPage(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const patientBtn = buttons.find((b) => b.textContent && b.textContent.includes('Rahul Sharma'));
        if (patientBtn) {
          patientBtn.click();
        }
      });
      await sleep(2000);

      // ──────────────────────────────────────────────────────────
      // 1. VERIFY REDESIGNED PATIENT HOME
      // ──────────────────────────────────────────────────────────
      console.log('\n--- VERIFYING NEW PATIENT HOME ---');
      const homeCheck = await evalInPage(() => {
        const text = document.body.innerText;
        return {
          hasErrorBoundary: text.includes('Section Temporarily Unavailable'),
          hasGreeting: text.includes('Rahul') && (text.includes('Good morning') || text.includes('Good afternoon') || text.includes('Good evening')),
          hasEmergencyHelpCard: text.includes('Need immediate help?') && text.includes('GET EMERGENCY HELP'),
          hasQuickActions: text.includes('Quick Actions') && text.includes('Healthcare Map'),
          hasMyHealth: text.includes('My Health') && text.includes('Blood Profile'),
          hasNearbyCare: text.includes('Nearby Care Facilities'),
          hasRecentActivity: text.includes('Recent Activity'),
        };
      });
      console.log('Home Verification:', homeCheck);

      // ──────────────────────────────────────────────────────────
      // 2. VERIFY NEW PATIENT PROFILE
      // ──────────────────────────────────────────────────────────
      console.log('\n--- VERIFYING NEW PATIENT PROFILE ---');
      await evalInPage(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn = buttons.find((b) => b.textContent?.trim() === 'Profile');
        if (btn) btn.click();
      });
      await sleep(1500);

      const profileCheck = await evalInPage(() => {
        const text = document.body.innerText;
        return {
          hasErrorBoundary: text.includes('Section Temporarily Unavailable'),
          hasPersonalInfo: text.includes('Personal Information') && text.includes('Primary Phone'),
          hasEmergencyContact: text.includes('Emergency Medical Contact'),
          hasHealthInfo: text.includes('Health Information') && text.includes('Pregnancy Mode Status'),
          hasAccountSettings: text.includes('Account Settings') && text.includes('Interface Language'),
        };
      });
      console.log('Profile Verification:', profileCheck);

      // ──────────────────────────────────────────────────────────
      // 3. VERIFY PREGNANCY CARE (SETUP + DASHBOARD)
      // ──────────────────────────────────────────────────────────
      console.log('\n--- VERIFYING PREGNANCY CARE MODULE ---');
      await evalInPage(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn = buttons.find((b) => b.textContent?.trim().includes('Pregnancy Care'));
        if (btn) btn.click();
      });
      await sleep(1500);

      const pregnancyInitCheck = await evalInPage(() => {
        const text = document.body.innerText;
        return {
          hasErrorBoundary: text.includes('Section Temporarily Unavailable'),
          isSetupScreen: text.includes('Set Up Pregnancy Mode') || text.includes('Personalized pregnancy care'),
          isDashboard: text.includes('Week') && text.includes('of 40') && text.includes('Pregnancy Care Timeline'),
        };
      });
      console.log('Pregnancy Care Initial View:', pregnancyInitCheck);

      // If setup screen is shown, fill form and enable pregnancy mode!
      if (pregnancyInitCheck.isSetupScreen) {
        console.log('Filling out Pregnancy Mode setup form...');
        await evalInPage(() => {
          const weekInput = document.querySelector('input[type="number"]');
          if (weekInput) {
            weekInput.value = '24';
            weekInput.dispatchEvent(new Event('input', { bubbles: true }));
            weekInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const notesInput = document.querySelector('textarea');
          if (notesInput) {
            notesInput.value = 'Regular antenatal checkups active. Prescribed calcium and iron supplements.';
            notesInput.dispatchEvent(new Event('input', { bubbles: true }));
            notesInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          const submitBtn = Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent && (b.textContent.includes('Enable Pregnancy Mode') || b.textContent.includes('Save'))
          );
          if (submitBtn) {
            submitBtn.click();
          }
        });
        await sleep(2000);
      }

      // Verify Pregnancy Dashboard is active
      const pregnancyDashboardCheck = await evalInPage(() => {
        const text = document.body.innerText;
        return {
          hasErrorBoundary: text.includes('Section Temporarily Unavailable'),
          hasWeekIndicator: text.includes('Week') && text.includes('of 40'),
          hasTrimester: text.includes('Trimester'),
          hasObstetricEmergency: text.includes('OBSTETRIC EMERGENCY SUPPORT') && text.includes('Pregnancy Emergency SOS'),
          hasProgress: text.includes('Pregnancy Progress') && text.includes('% Completed'),
          hasAssignedHospital: text.includes('Assigned Hospital Facility'),
          hasTimeline: text.includes('Pregnancy Care Timeline') && text.includes('Trimester 1') && text.includes('Trimester 2'),
        };
      });
      console.log('Pregnancy Dashboard Verification:', pregnancyDashboardCheck);

      // ──────────────────────────────────────────────────────────
      // 4. NAVIGATE BACK TO HOME AND VERIFY PREGNANCY INTEGRATION
      // ──────────────────────────────────────────────────────────
      console.log('\n--- RETURNING TO HOME TAB ---');
      await evalInPage(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const btn = buttons.find((b) => b.textContent?.trim() === 'Home');
        if (btn) btn.click();
      });
      await sleep(1500);

      const homeAgainCheck = await evalInPage(() => {
        const text = document.body.innerText;
        return {
          hasErrorBoundary: text.includes('Section Temporarily Unavailable'),
          hasPregnancyCardActive: text.includes('Pregnancy Care') && text.includes('Week'),
          hasEmergencyCard: text.includes('Need immediate help?'),
        };
      });
      console.log('Home Re-render Verification:', homeAgainCheck);

      // ──────────────────────────────────────────────────────────
      // 5. TEST OTHER MODULES
      // ──────────────────────────────────────────────────────────
      console.log('\n--- TESTING OTHER MODULE TABS ---');
      const tabs = ['Emergency Help', 'Appointments', 'Healthcare Map', 'Donor Mode', 'Care Directory', 'Ask Lifeline'];
      for (const tab of tabs) {
        await evalInPage((name) => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const btn = buttons.find((b) => b.textContent?.trim().includes(name));
          if (btn) btn.click();
        }, tab);
        await sleep(1000);

        const check = await evalInPage(() => {
          const text = document.body.innerText;
          return {
            hasErrorBoundary: text.includes('Section Temporarily Unavailable'),
            length: text.length,
          };
        });

        if (check.hasErrorBoundary) {
          console.error(`❌ Module ${tab} failed!`);
        } else {
          console.log(`✔ Module ${tab} rendered cleanly.`);
        }
      }

      console.log('\n=============================================');
      console.log(`FINAL REPORT: Uncaught Exceptions: ${uncaughtExceptions.length}, Console Errors: ${errors.length}`);
      console.log('=============================================');

      const allSuccess =
        !homeCheck.hasErrorBoundary &&
        !profileCheck.hasErrorBoundary &&
        !pregnancyDashboardCheck.hasErrorBoundary &&
        !homeAgainCheck.hasErrorBoundary;

      ws.close();
      edge.kill();
      process.exit(allSuccess ? 0 : 1);
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      edge.kill();
      process.exit(1);
    };
  } catch (err) {
    console.error('Run Error:', err);
    edge.kill();
    process.exit(1);
  }
}

run();
