import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA = path.join(process.cwd(), 'node_modules', '.tmp_edge_profile');

if (!fs.existsSync(USER_DATA)) {
  fs.mkdirSync(USER_DATA, { recursive: true });
}

console.log('Launching headless Edge to capture exact browser console & runtime errors...');
const edge = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${USER_DATA}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:5173'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await sleep(2000);

  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    const pageTab = tabs.find((t) => t.type === 'page');

    if (!pageTab || !pageTab.webSocketDebuggerUrl) {
      console.error('No page tab with webSocketDebuggerUrl found:', tabs);
      edge.kill();
      return;
    }

    console.log('Connecting to Edge CDP at:', pageTab.webSocketDebuggerUrl);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => {
      const msgId = id++;
      ws.send(JSON.stringify({ id: msgId, method, params }));
      return msgId;
    };

    ws.onopen = async () => {
      send('Runtime.enable');
      send('Console.enable');
      send('Page.enable');

      console.log('Waiting 2 seconds for AuthScreen to load...');
      await sleep(2000);

      console.log('Opening Developer Test Sandbox drawer...');
      send('Runtime.evaluate', {
        expression: `
          (function() {
            const buttons = Array.from(document.querySelectorAll('button'));
            const sandboxBtn = buttons.find(b => b.textContent && b.textContent.includes('Developer Test Sandbox'));
            if (sandboxBtn) {
              sandboxBtn.click();
              return 'Opened Developer Test Sandbox drawer';
            }
            return 'Developer Test Sandbox button not found';
          })()
        `,
        returnByValue: true
      });

      await sleep(1000);

      console.log('Clicking persona button (Rahul Sharma - Patient)...');
      send('Runtime.evaluate', {
        expression: `
          (function() {
            const buttons = Array.from(document.querySelectorAll('button'));
            const personaBtn = buttons.find(b => b.textContent && (b.textContent.includes('Rahul Sharma') || b.textContent.includes('Patient Mode')));
            if (personaBtn) {
              personaBtn.click();
              return 'Clicked persona button: ' + personaBtn.textContent.trim();
            }
            return 'Persona button not found among: ' + buttons.map(b => b.textContent.trim()).join(' | ');
          })()
        `,
        returnByValue: true
      });

      console.log('Waiting 3 seconds for dashboard to mount...');
      await sleep(3000);

      console.log('Now finding and clicking Map tab in navigation...');
      send('Runtime.evaluate', {
        expression: `
          (function() {
            const buttons = Array.from(document.querySelectorAll('button'));
            const mapBtn = buttons.find(b => b.textContent && (b.textContent.includes('Healthcare Map') || b.textContent.includes('Map') || b.textContent.includes('Facility Map') || b.textContent.includes('Supply Network')));
            if (mapBtn) {
              console.log('Found Map button, clicking: ' + mapBtn.textContent.trim());
              mapBtn.click();
              return 'Clicked: ' + mapBtn.textContent.trim();
            }
            return 'Map button not found among: ' + buttons.map(b => b.textContent.trim()).join(' | ');
          })()
        `,
        returnByValue: true
      });

      console.log('Waiting 4 seconds to observe Map render / blank screen / uncaught errors...');
      await sleep(4000);

      send('Runtime.evaluate', {
        expression: `
          (function() {
            return {
              bodySnippet: document.body.innerHTML.slice(0, 400),
              hasSidebar: !!document.querySelector('.lx-sidebar, nav, aside'),
              mainContent: document.getElementById('main-content')?.innerHTML.slice(0, 400) || 'no main content',
              totalBodyLength: document.body.innerHTML.length
            };
          })()
        `,
        returnByValue: true
      });

      await sleep(2000);
      ws.close();
      edge.kill();
      process.exit(0);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.consoleAPICalled') {
        const args = (data.params.args || []).map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
        console.log(`[BROWSER CONSOLE ${data.params.type.toUpperCase()}]:`, args);
      } else if (data.method === 'Runtime.exceptionThrown') {
        console.error('\n🔴 [UNCAUGHT BROWSER EXCEPTION]:', data.params.exceptionDetails.exception?.description || data.params.exceptionDetails);
        // Inspect window.google right after exception
        send('Runtime.evaluate', {
          expression: `
            ({
              hasGoogle: typeof window.google !== 'undefined',
              googleKeys: typeof window.google !== 'undefined' ? Object.keys(window.google) : [],
              mapsKeys: typeof window.google?.maps !== 'undefined' ? Object.keys(window.google.maps) : [],
              typeOfMap: typeof window.google?.maps?.Map,
              mapVal: String(window.google?.maps?.Map)
            })
          `,
          returnByValue: true
        });
      } else if (data.result && data.result.result) {
        console.log('[CDP RESULT]:', data.result.result.value);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      edge.kill();
    };
  } catch (err) {
    console.error('Failed to connect to CDP:', err);
    edge.kill();
  }
}

run();
