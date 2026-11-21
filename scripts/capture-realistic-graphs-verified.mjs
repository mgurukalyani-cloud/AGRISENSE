import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9559;
const TEMP_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\agrisense-weather\\scratch-cdp-graphs';
const ARTIFACTS_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

console.log('Launching Chrome with remote debugging on port ' + PORT);
const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TEMP_DIR}`,
  '--no-sandbox',
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1440,1400',
  'https://mgurukalyani-cloud.github.io/AGRISENSE/'
]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function sendCdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const msg = JSON.stringify({ id, method, params });
    const handler = (evt) => {
      const res = JSON.parse(evt.data);
      if (res.id === id) {
        ws.removeEventListener('message', handler);
        if (res.error) reject(res.error);
        else resolve(res.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(msg);
  });
}

async function run() {
  console.log('Waiting 10s for page load...');
  await sleep(10000);

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json`);
    const tabs = await listRes.json();
    console.log('Tabs:', tabs.map(t => ({ title: t.title, url: t.url })));

    const targetTab = tabs.find(t => t.url && t.url.includes('mgurukalyani-cloud')) || tabs.find(t => t.type === 'page') || tabs[0];
    console.log('Connecting to target tab:', targetTab?.url);

    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');

    // Force reload with cache bypass
    await sendCdp(ws, 'Page.reload', { ignoreCache: true });
    await sleep(6000);

    // Scroll directly to the 48-Hour Agrometeorological Graph
    console.log('Scrolling to 48-Hour Agrometeorological Graph...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const header = Array.from(document.querySelectorAll('h2, h3')).find(h => h.textContent && h.textContent.includes('48-Hour Agrometeorological Graph'));
        if (header) {
          header.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      })()`
    });
    await sleep(1500);

    // Screenshot 1: All-in-One Agrometeo curve with real telemetry
    const shot1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath1 = path.join(ARTIFACTS_DIR, 'live-graphs-48h-operational.png');
    fs.writeFileSync(shotPath1, Buffer.from(shot1.data, 'base64'));
    console.log('Saved Screenshot 1:', shotPath1);

    // Click "Thermal & Dew Point Dynamics" tab
    console.log('Clicking Thermal & Dew Point tab...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Thermal & Dew Point'));
        if (btn) btn.click();
      })()`
    });
    await sleep(1500);

    // Screenshot 2: Thermal & Dew Point Curve
    const shot2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath2 = path.join(ARTIFACTS_DIR, 'live-graphs-thermal-dewpoint.png');
    fs.writeFileSync(shotPath2, Buffer.from(shot2.data, 'base64'));
    console.log('Saved Screenshot 2:', shotPath2);

    // Click "Wind Velocity & Spraying Safety Window" tab
    console.log('Clicking Wind Velocity & Spraying Safety Window tab...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Wind Velocity & Spraying'));
        if (btn) btn.click();
      })()`
    });
    await sleep(1500);

    // Screenshot 3: Spray Drift Hazard & Wind Graph
    const shot3 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath3 = path.join(ARTIFACTS_DIR, 'live-graphs-spray-drift.png');
    fs.writeFileSync(shotPath3, Buffer.from(shot3.data, 'base64'));
    console.log('Saved Screenshot 3:', shotPath3);

    // Scroll to 10-day forecast graph
    console.log('Scrolling down to 10-Day Forecast graph...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const header = Array.from(document.querySelectorAll('h3')).find(h => h.textContent && h.textContent.includes('10-Day Agrometeorological Forecast Trajectory'));
        if (header) {
          header.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      })()`
    });
    await sleep(1500);

    // Screenshot 4: 10-Day Forecast Corridors
    const shot4 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const shotPath4 = path.join(ARTIFACTS_DIR, 'live-graphs-10day-corridor.png');
    fs.writeFileSync(shotPath4, Buffer.from(shot4.data, 'base64'));
    console.log('Saved Screenshot 4:', shotPath4);

    ws.close();
  } catch (err) {
    console.error('Error during graphs verification:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

run();
