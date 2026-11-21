import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = path.join(ARTIFACTS_DIR, 'scratch', 'cdp_diag_profile');

if (!fs.existsSync(USER_DATA)) {
  fs.mkdirSync(USER_DATA, { recursive: true });
}

const chromeProc = spawn(CHROME_PATH, [
  '--remote-debugging-port=9223',
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${USER_DATA}`,
  '--window-size=1440,2400',
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
  await wait(6000);
  const verRes = await fetch('http://127.0.0.1:9223/json');
  const tabs = await verRes.json();
  const agriTab = tabs.find(t => t.url && t.url.includes('mgurukalyani-cloud'));
  if (!agriTab) {
    console.error('No tab found:', tabs);
    chromeProc.kill();
    return;
  }

  ws = new WebSocket(agriTab.webSocketDebuggerUrl);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Console.messageAdded') {
      console.log('BROWSER CONSOLE:', data.params.message.text);
    }
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  };

  await new Promise(res => { ws.onopen = res; });
  await send('Console.enable');
  await send('Page.enable');
  await send('Runtime.enable');

  await wait(4000);

  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        return {
          title: document.title,
          url: window.location.href,
          h2s: Array.from(document.querySelectorAll('h2, h3')).map(h => h.textContent.trim()),
          svgs: document.querySelectorAll('svg.recharts-surface').length
        };
      })()
    `,
    returnByValue: true
  });
  console.log('DOM Evaluation:', JSON.stringify(evalRes.result.value, null, 2));

  // Capture full page screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'live-site-fullpage-graphs.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved fullpage screenshot live-site-fullpage-graphs.png, size:', shot.data.length);

  ws.close();
  chromeProc.kill();
}

run().catch(e => {
  console.error(e);
  chromeProc.kill();
});
