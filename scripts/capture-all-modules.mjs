import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9788;
const TEMP_DIR = path.resolve('scratch-chrome-preview-' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TEMP_DIR}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1440,1100',
  'http://localhost:5173/16th-hackathon/'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreen(ws, send, filename) {
  const raw = await send('Page.captureScreenshot', { format: 'png' });
  const data = raw?.result?.data || raw?.data;
  const localPath = path.resolve(filename);
  const targetPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
  fs.copyFileSync(localPath, targetPath);
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  await sleep(4000);
  const tabsRes = await fetch(`http://127.0.0.1:${PORT}/json`);
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('16th-hackathon')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let msgId = 0;
  const callbacks = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = ++msgId;
      callbacks.set(id, (res) => resolve(res));
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await sleep(3000);

  // 1. Overview Weather Dashboard
  console.log('Capturing Weather Overview...');
  await captureScreen(ws, send, 'preview-weather-overview.png');

  // 2. Plant Health
  console.log('Navigating to Plant Health...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-tab-id="plant_health"]');
      if (btn) btn.click();
      window.scrollTo(0, 0);
    })()`
  });
  await sleep(2000);
  await captureScreen(ws, send, 'preview-plant-health.png');

  // 3. Crop Planning & Mandi Prices
  console.log('Navigating to Crop Planning...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-tab-id="crop_planning"]');
      if (btn) btn.click();
      window.scrollTo(0, 0);
    })()`
  });
  await sleep(2000);
  await captureScreen(ws, send, 'preview-crop-planning.png');

  // 4. Animal Sound AI & Bio-Acoustic Repellent
  console.log('Navigating to Animal Sound AI...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-tab-id="animal_repellent"]');
      if (btn) btn.click();
      window.scrollTo(0, 0);
    })()`
  });
  await sleep(2000);
  await captureScreen(ws, send, 'preview-animal-repellent.png');

  // 5. Farm Insights
  console.log('Navigating to Farm Insights...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-tab-id="farm_insights"]');
      if (btn) btn.click();
      window.scrollTo(0, 0);
    })()`
  });
  await sleep(2000);
  await captureScreen(ws, send, 'preview-farm-insights.png');

  // 6. Voice Assistant Modal
  console.log('Opening Voice Assistant...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*="Voice Assistant"]') ||
                  document.querySelector('button[aria-label*="Voice Assistant"]') ||
                  document.querySelector('.floating-voice-btn');
      if (btn) btn.click();
    })()`
  });
  await sleep(2000);
  await captureScreen(ws, send, 'preview-voice-assistant.png');

  console.log('All module preview screenshots captured successfully!');
  ws.close();
  chrome.kill();
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch (_) {}
}

run().catch(e => {
  console.error('Error capturing preview screens:', e);
  chrome.kill();
});
