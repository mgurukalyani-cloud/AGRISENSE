import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePort = 9446;
const tempProfile = path.resolve('temp_chrome_live_' + Date.now());

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${chromePort}`,
  `--user-data-dir=${tempProfile}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1280,820',
  'https://mgurukalyani-cloud.github.io/AGRISENSE/'
]);

async function verifyLive() {
  await new Promise(r => setTimeout(r, 4000));
  const tabs = await fetch(`http://127.0.0.1:${chromePort}/json`).then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('github.io')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let id = 0;
  const send = (method, params = {}) => new Promise(resolve => {
    const curId = ++id;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(d);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  // Wait 3 seconds for rendering
  await new Promise(r => setTimeout(r, 3000));

  const pageInfo = await send('Runtime.evaluate', {
    expression: `
      (() => ({
        title: document.title,
        url: window.location.href,
        heading: document.querySelector('h1')?.innerText,
        buttonsCount: document.querySelectorAll('button').length
      }))()
    `,
    returnByValue: true
  });
  console.log('Live Page Info:', pageInfo.result?.value);

  const shot = await send('Page.captureScreenshot');
  const shotPath = path.resolve('live-site-restored.png');
  fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
  console.log('Saved screenshot of live site to:', shotPath);

  ws.close();
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
}

verifyLive().catch(err => {
  console.error('Live Verification Error:', err);
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  process.exit(1);
});
