import { spawn } from 'child_process';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const USER_DATA = path.join(process.cwd(), 'node_modules', '.tmp_edge_profile2');

const edge = spawn(EDGE_PATH, [
  '--headless=new',
  '--remote-debugging-port=9223',
  `--user-data-dir=${USER_DATA}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'http://localhost:5173'
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  await sleep(2000);
  const res = await fetch('http://127.0.0.1:9223/json');
  const tabs = await res.json();
  const pageTab = tabs.find((t) => t.type === 'page');

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

  ws.onopen = async () => {
    send('Runtime.enable');
    send('Console.enable');

    await sleep(2000);

    // Evaluate window.google
    send('Runtime.evaluate', {
      expression: `
        (async function() {
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            console.log('API KEY present:', !!apiKey);

            // Dynamically import @googlemaps/js-api-loader
            const { setOptions, importLibrary } = await import('/node_modules/.vite/deps/@googlemaps_js-api-loader.js?v=e9bd70a4');
            setOptions({ key: apiKey, v: 'weekly' });
            console.log('Calling importLibrary("maps")...');
            const mapsLib = await importLibrary('maps');
            console.log('mapsLib keys:', Object.keys(mapsLib));
            console.log('typeof mapsLib.Map:', typeof mapsLib.Map);
            console.log('typeof window.google:', typeof window.google);
            console.log('typeof window.google.maps:', typeof window.google?.maps);
            console.log('typeof window.google.maps.Map:', typeof window.google?.maps?.Map);
            return {
              mapsLibMap: typeof mapsLib.Map,
              windowGoogleMapsMap: typeof window.google?.maps?.Map
            };
          } catch (e) {
            console.error('Error during test:', e.message, e.stack);
            return { error: e.message };
          }
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    await sleep(4000);
    ws.close();
    edge.kill();
    process.exit(0);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = (data.params.args || []).map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[BROWSER]:`, args);
    } else if (data.result && data.result.result) {
      console.log('[EVAL RESULT]:', data.result.result.value);
    }
  };
}

run();
