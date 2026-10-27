import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const chromePort = 9447;
const tempProfile = path.resolve('temp_chrome_root_' + Date.now());

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${chromePort}`,
  `--user-data-dir=${tempProfile}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1280,820',
  'https://mgurukalyani-cloud.github.io/AGRISENSE/'
]);

async function capture() {
  await new Promise(r => setTimeout(r, 4500));
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

  // Wait for rendering
  await new Promise(r => setTimeout(r, 3500));

  const evaluation = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          title: document.title,
          heading: document.querySelector('h1')?.innerText,
          bodySnippet: document.body.innerText.slice(0, 300).replace(/\\n+/g, ' '),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean).slice(0, 8)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Evaluated live DOM on root URL:', JSON.stringify(evaluation.result?.value, null, 2));

  const shot = await send('Page.captureScreenshot');
  const artifactPath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177\\agrisense-live-root.png';
  fs.writeFileSync(artifactPath, Buffer.from(shot.result.data, 'base64'));
  console.log('Saved live screenshot to artifact:', artifactPath);

  ws.close();
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
}

capture().catch(e => {
  console.error('Capture error:', e);
  chrome.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  process.exit(1);
});
