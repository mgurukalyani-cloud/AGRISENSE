import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('dist');
const HTTP_PORT = 5196;
const CDP_PORT = 9816;
const TEMP_USER_DIR = path.resolve('scratch-chrome-debug-' + Date.now());

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]).replace(/^\/AGRISENSE\/?/, '/');
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  let filePath = path.join(DIST, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(DIST, 'index.html');
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

server.listen(HTTP_PORT, async () => {
  if (!fs.existsSync(TEMP_USER_DIR)) fs.mkdirSync(TEMP_USER_DIR, { recursive: true });
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    `http://localhost:${HTTP_PORT}`
  ]);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(2500);

  const tabs = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(r => r.json());
  const tab = tabs.find(t => t.url && t.url.includes(String(HTTP_PORT))) || tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const send = (method, params = {}) => new Promise((resolve) => {
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

  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', d.params.type, d.params.args.map(a => a.value !== undefined ? JSON.stringify(a.value) : a.description).join(' '));
    }
    if (d.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await sleep(2500);

  // Switch to repellent
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[data-tab-id="animal_repellent"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bio-AI'));
        if (btn) btn.click();
      })()
    `
  });
  await sleep(1500);

  // Switch to soundboard
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Soundboard'));
        if (btn) btn.click();
      })()
    `
  });
  await sleep(1500);

  // Click Wild Boar test sound
  console.log('Testing Wild Boar click...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[data-sample-key="wild_boar"]');
        if (!btn) return 'Button not found!';
        btn.click();
        return 'Clicked successfully: ' + btn.textContent.trim();
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', clickRes.result.result.value);

  // Wait 4 seconds for audio + classify
  await sleep(4000);

  // Check result
  const check = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('button[data-sample-key="wild_boar"]');
        const card = btn ? btn.closest('.rounded-2xl') : null;
        const banner = document.querySelector('.bg-gradient-to-br.from-slate-900');
        return {
          cardText: card ? card.innerText : 'Card not found',
          bannerText: banner ? banner.innerText : 'Banner not found'
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Result:\n', check.result.result.value);

  ws.close();
  chrome.kill();
  try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
  server.close();
  process.exit(0);
});
