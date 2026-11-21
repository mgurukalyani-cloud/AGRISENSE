import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(ARTIFACTS_DIR, 'scratch', 'cdp_graphs_profile');

if (!fs.existsSync(USER_DATA)) {
  fs.mkdirSync(USER_DATA, { recursive: true });
}

console.log('Starting headless Chrome...');
const chromeProc = spawn(CHROME_PATH, [
  '--remote-debugging-port=9222',
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${USER_DATA}`,
  '--window-size=1440,1800',
  'https://mgurukalyani-cloud.github.io/AGRISENSE/'
]);

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

let ws = null;
let msgId = 1;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  console.log('Waiting 10s for page load & GitHub Pages cache update...');
  await wait(10000);

  const verRes = await fetch('http://127.0.0.1:9222/json');
  const tabs = await verRes.json();
  const agriTab = tabs.find(t => t.url && t.url.includes('mgurukalyani-cloud'));
  if (!agriTab) {
    console.error('No agriTab found! Available:', tabs);
    chromeProc.kill();
    process.exit(1);
  }

  console.log('Connecting to AgriSense live tab via CDP:', agriTab.webSocketDebuggerUrl);
  ws = new WebSocket(agriTab.webSocketDebuggerUrl);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise(res => { ws.onopen = res; });
  console.log('CDP connection open.');

  await send('Page.enable');
  await send('Runtime.enable');

  // Hard reload to bypass cache
  console.log('Hard reloading to ensure newest bundle...');
  await send('Page.reload', { ignoreCache: true });
  await wait(8000);

  // Take full page screenshot of the 48-Hour Agrometeorological Graph
  console.log('Capturing live realistic graphs overview screenshot...');
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live-realistic-graphs-overview.png'), Buffer.from(shot1.data, 'base64'));
  console.log('✓ Saved live-realistic-graphs-overview.png');

  // Click on "Thermal & Dew Point Dynamics" tab on the 48h chart
  console.log('Clicking Thermal & Dew Point tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const thermalBtn = btns.find(b => b.textContent && b.textContent.includes('Thermal & Dew Point'));
        if (thermalBtn) {
          thermalBtn.click();
          return 'CLICKED_THERMAL';
        }
        return 'NOT_FOUND';
      })()
    `
  });
  await wait(2000);

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live-graph-thermal-dewpoint.png'), Buffer.from(shot2.data, 'base64'));
  console.log('✓ Saved live-graph-thermal-dewpoint.png');

  // Scroll to 10-Day Forecast graph and click "Rainfall vs Crop ET₀"
  console.log('Scrolling down to 10-day forecast and clicking Rainfall vs Crop ET0...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const waterBtn = btns.find(b => b.textContent && b.textContent.includes('Rainfall vs Crop ET'));
        if (waterBtn) {
          waterBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          waterBtn.click();
          return 'CLICKED_WATER';
        }
        return 'NOT_FOUND';
      })()
    `
  });
  await wait(2000);

  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live-graph-10day-forecast.png'), Buffer.from(shot3.data, 'base64'));
  console.log('✓ Saved live-graph-10day-forecast.png');

  ws.close();
  chromeProc.kill();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Error during verification:', err);
  if (chromeProc) chromeProc.kill();
  process.exit(1);
});
