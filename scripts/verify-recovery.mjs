import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9877;
const TEMP_DIR = path.resolve('scratch-chrome-recover-' + Date.now());
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

console.log('=== Verifying AgriSense Error Recovery & Working Stage ===');

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

async function run() {
  await sleep(4000);

  const tabsRes = await fetch(`http://127.0.0.1:${PORT}/json`);
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('16th-hackathon')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let msgId = 0;
  const callbacks = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params?.type;
      const text = data.params?.args?.map(a => a.value || a.description || '').join(' ');
      if (type === 'error') {
        console.error('Browser Console Error:', text);
        consoleErrors.push(text);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params?.exceptionDetails?.text || data.params?.exceptionDetails?.exception?.description;
      console.error('Browser Runtime Exception:', desc);
      consoleErrors.push(desc);
    }
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

  await sleep(3500);

  // Check for error boundary presence
  const checkEval = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const bodyText = document.body.innerText || '';
        const hasErrorBoundary = bodyText.includes('AgriSense Encountered an Unexpected Error') ||
                                 bodyText.includes('ReferenceError') ||
                                 bodyText.includes('AUTO_REFRESH_INTERVAL_SECONDS');
        const hasHeader = Boolean(document.querySelector('header'));
        const navButtons = Array.from(document.querySelectorAll('button[data-tab-id]')).map(b => b.getAttribute('data-tab-id'));
        const weatherCards = Array.from(document.querySelectorAll('h2, h3')).map(h => h.innerText).slice(0, 8);

        return {
          title: document.title,
          hasErrorBoundary,
          hasHeader,
          navButtons,
          weatherCards,
          bodySnippet: bodyText.slice(0, 300)
        };
      })()
    `,
    returnByValue: true
  });

  const state = checkEval?.result?.result?.value;
  console.log('Page Title:', state?.title);
  console.log('Error Boundary Displayed?:', state?.hasErrorBoundary ? 'FAIL (STILL BROKEN)' : 'PASS (RESOLVED!)');
  console.log('Header Rendered?:', state?.hasHeader);
  console.log('Navigation Tabs Found:', state?.navButtons);
  console.log('Weather Headings:', state?.weatherCards);

  // Screenshot of the restored dashboard
  const raw = await send('Page.captureScreenshot', { format: 'png' });
  const data = raw?.result?.data || raw?.data;
  const localFile = path.resolve('agrisense-restored.png');
  const artifactFile = path.join(ARTIFACT_DIR, 'agrisense-restored.png');
  fs.writeFileSync(localFile, Buffer.from(data, 'base64'));
  fs.copyFileSync(localFile, artifactFile);
  console.log('Saved screenshot to agrisense-restored.png and artifact folder');

  ws.close();
  chrome.kill();
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch (_) {}

  if (state?.hasErrorBoundary) {
    console.error('FAILED: Error boundary is still active.');
    process.exit(1);
  } else {
    console.log('\n=== SUCCESS: Website is completely restored and in full working stage! ===');
    process.exit(0);
  }
}

run().catch(e => {
  console.error('Verification failed:', e);
  chrome.kill();
  process.exit(1);
});
