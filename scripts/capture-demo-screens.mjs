import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9799;
const TEMP_DIR = path.resolve('scratch-chrome-demo-' + Date.now());

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TEMP_DIR}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1440,1200',
  'http://localhost:5173/16th-hackathon/'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await sleep(3500);
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

  await sleep(2500);

  // 1. Click Animal Sound AI Tab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-tab-id="animal_repellent"]');
      if (btn) btn.click();
    })()`
  });
  await sleep(2000);

  // 2. Trigger harmful target click 1, then click 2 to show Target Confirmed & Alert Activated
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-demo-scenario="harmful"]');
      if (btn) {
        btn.click();
        setTimeout(() => btn.click(), 500);
      }
    })()`
  });
  await sleep(1500);

  // 3. Scroll to Demo Controls & Latest Detection Result
  await send('Runtime.evaluate', {
    expression: `(() => {
      const panel = document.querySelector('button[data-demo-scenario="cow"]');
      if (panel) {
        panel.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo({ top: 750, behavior: 'instant' });
      }
    })()`
  });
  await sleep(1000);

  const rawShot1 = await send('Page.captureScreenshot', { format: 'png' });
  const shot1Data = rawShot1?.result?.data || rawShot1?.data;
  fs.writeFileSync('animal-repellent-demo-controls.png', Buffer.from(shot1Data, 'base64'));

  // 4. Click "Demo Simulation & Testing" Tab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText && b.innerText.includes('Demo Simulation & Testing'));
      if (btns.length > 0) btns[0].click();
      window.scrollTo({ top: 380, behavior: 'instant' });
    })()`
  });
  await sleep(1200);

  const rawShot2 = await send('Page.captureScreenshot', { format: 'png' });
  const shot2Data = rawShot2?.result?.data || rawShot2?.data;
  fs.writeFileSync('animal-repellent-demo-tab.png', Buffer.from(shot2Data, 'base64'));

  // Copy to artifacts
  const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
  ['animal-repellent-demo-controls.png', 'animal-repellent-demo-tab.png'].forEach(f => {
    if (fs.existsSync(f)) {
      fs.copyFileSync(f, path.join(artifactDir, f));
    }
  });

  console.log('Demo screenshots saved successfully.');
  ws.close();
  chrome.kill();
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch (_) {}
}

run().catch(e => {
  console.error(e);
  chrome.kill();
});
