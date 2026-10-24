import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9892;
const TEMP_DIR = path.resolve('scratch-chrome-animal-' + Date.now());
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
  '--window-size=1440,1200',
  'http://localhost:5173/16th-hackathon/'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  await sleep(2500);

  // Click Animal Sound AI Tab
  console.log('Clicking Animal Sound AI Tab...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[data-tab-id="animal_repellent"]');
      if (btn) btn.click();
    })()`
  });

  await sleep(2500);

  // Inspect DOM inside Animal Sound AI
  const domCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText);
      const subTabs = Array.from(document.querySelectorAll('button')).map(b => b.innerText).filter(t => t.includes('Surveillance') || t.includes('Demo') || t.includes('Protection') || t.includes('Alert') || t.includes('History'));
      const hasError = document.body.innerText.includes('AgriSense Encountered an Unexpected Error');
      return {
        hasError,
        headers: headers.slice(0, 10),
        subTabs: subTabs.slice(0, 8)
      };
    })()`,
    returnByValue: true
  });

  console.log('DOM Evaluation Result:', JSON.stringify(domCheck?.result?.result?.value, null, 2));

  // Take screenshot
  const raw = await send('Page.captureScreenshot', { format: 'png' });
  const data = raw?.result?.data || raw?.data;
  const localFile = path.resolve('animal-sound-tab-working.png');
  const artifactFile = path.join(ARTIFACT_DIR, 'animal-sound-tab-working.png');
  fs.writeFileSync(localFile, Buffer.from(data, 'base64'));
  fs.copyFileSync(localFile, artifactFile);
  console.log('Screenshot saved to animal-sound-tab-working.png and copied to artifact folder');

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch (_) {}

  if (domCheck?.result?.result?.value?.hasError) {
    console.error('FAILED: Error boundary still detected!');
    process.exit(1);
  } else {
    console.log('SUCCESS: Animal Sound AI tab loaded and verified!');
    process.exit(0);
  }
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
