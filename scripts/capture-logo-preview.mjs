import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const PORT = 9897;

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  'http://localhost:5173/16th-hackathon/'
]);

async function run() {
  console.log('Starting Chrome to capture logo preview...');
  await new Promise(r => setTimeout(r, 3500));

  const tabs = await fetch(`http://127.0.0.1:${PORT}/json`).then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('16th-hackathon')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let id = 0;
  const send = (method, params = {}) => new Promise(res => {
    const curId = ++id;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        res(d);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  await new Promise(r => setTimeout(r, 2000));

  // 1. Capture Splash Screen (if visible)
  const isSplashVisible = await send('Runtime.evaluate', {
    expression: `!!document.querySelector('img[alt="KLH Farms Logo"]')`,
    returnByValue: true
  });
  console.log('Splash Screen Logo detected:', isSplashVisible.result?.value);

  const shotSplash = await send('Page.captureScreenshot', { format: 'png' });
  const fileSplash = path.join(ARTIFACT_DIR, 'klh-farms-splash-preview.png');
  fs.writeFileSync(fileSplash, Buffer.from(shotSplash.result.data, 'base64'));
  console.log('Saved splash preview screenshot to:', fileSplash);

  // Click proceed button on splash screen to enter main dashboard
  await send('Runtime.evaluate', {
    expression: `(() => {
      const proceedBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Open KLH Farms Dashboard') || b.textContent.includes('Dashboard'));
      if (proceedBtn) proceedBtn.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 1500));

  // 2. Capture Header with KLH Farms logo
  const shotHeader = await send('Page.captureScreenshot', { format: 'png' });
  const fileHeader = path.join(ARTIFACT_DIR, 'klh-farms-header-preview.png');
  fs.writeFileSync(fileHeader, Buffer.from(shotHeader.result.data, 'base64'));
  console.log('Saved header preview screenshot to:', fileHeader);

  chrome.kill();
  console.log('Logo preview capture complete!');
}

run().catch(err => {
  console.error('Failed to capture logo preview:', err);
  chrome.kill();
  process.exit(1);
});
