import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const PORT = 9898;
const TARGET_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/';

console.log(`Testing Live GitHub Pages: ${TARGET_URL}...`);

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  TARGET_URL
]);

async function run() {
  await new Promise(r => setTimeout(r, 4000));
  const tabs = await fetch(`http://127.0.0.1:${PORT}/json`).then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('github.io')) || tabs[0];
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

  const errors = [];
  ws.addEventListener('message', e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled' && d.params?.type === 'error') {
      const text = d.params?.args?.map(a => a.value || a.description || '').join(' ');
      errors.push(text);
    }
  });

  // Wait 5 seconds for page load, redirect (if applicable), and React hydration
  await new Promise(r => setTimeout(r, 5000));

  const checkRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const bodyText = document.body.innerText;
      return {
        url: window.location.href,
        title: document.title,
        textPreview: bodyText.substring(0, 180),
        hasAgriSense: bodyText.includes('AgriSense') || bodyText.includes('KLH'),
        hasLogo: !!document.querySelector('img[alt*="KLH"]'),
        rootChildCount: document.getElementById('root')?.children?.length || 0
      };
    })()`,
    returnByValue: true
  });

  const info = checkRes.result?.result?.value;
  console.log('Live Page Info:', info);
  console.log('Errors:', errors);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const shotFile = path.join(ARTIFACT_DIR, 'live-github-pages-resolved.png');
  fs.writeFileSync(shotFile, Buffer.from(shot.result.data, 'base64'));
  console.log('Screenshot saved to:', shotFile);

  chrome.kill();
  if (info && (info.hasAgriSense || info.rootChildCount > 0)) {
    console.log('SUCCESS: Live GitHub Pages is WORKING and NOT blank!');
  } else {
    console.error('FAILURE: Page still appears blank!');
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error('Test error:', err);
  chrome.kill();
  process.exit(1);
});
