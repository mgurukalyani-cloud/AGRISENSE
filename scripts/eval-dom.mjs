import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9560;
const TEMP_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\agrisense-weather\\scratch-cdp-eval';

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

async function run() {
  await new Promise(r => setTimeout(r, 6000));
  const res = await fetch(`http://127.0.0.1:${PORT}/json`);
  const tabs = await res.json();
  const target = tabs.find(t => t.url && t.url.includes('mgurukalyani-cloud')) || tabs[0];
  
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  const pending = new Map();
  let id = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const myId = id++;
      pending.set(myId, { resolve, reject });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  }
  ws.addEventListener('message', e => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id).resolve(data.result);
      pending.delete(data.id);
    }
  });

  await send('Runtime.enable');
  const domInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        bodyText: document.body.innerText.slice(0, 400),
        chartElements: document.querySelectorAll('.recharts-responsive-container').length,
        svgs: document.querySelectorAll('svg').length,
        h2s: Array.from(document.querySelectorAll('h2, h3')).map(h => h.innerText)
      };
    })()`,
    returnByValue: true
  });
  console.log('DOM INFO:', JSON.stringify(domInfo.result.value, null, 2));

  ws.close();
  chrome.kill();
}
run();
