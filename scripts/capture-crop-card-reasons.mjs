import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('dist');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTTP_PORT = 5186;
const CDP_PORT = 9797;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-crops-' + Date.now());

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]).replace(/^\/AGRISENSE\/?/, '/');
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  let filePath = path.join(DIST, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

server.listen(HTTP_PORT, async () => {
  if (!fs.existsSync(TEMP_USER_DIR)) fs.mkdirSync(TEMP_USER_DIR, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1440,1200',
    `http://localhost:${HTTP_PORT}`
  ]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function sendCmd(ws, callbacks, method, params = {}) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
      callbacks.set(id, (res) => resolve(res));
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  try {
    await sleep(3500);
    const tabsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const tabs = await tabsRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    const callbacks = new Map();
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.id && callbacks.has(d.id)) {
        callbacks.get(d.id)(d);
        callbacks.delete(d.id);
      }
    };
    await new Promise(r => ws.onopen = r);
    await sendCmd(ws, callbacks, 'Page.enable');
    await sendCmd(ws, callbacks, 'Runtime.enable');

    await sleep(2000);

    // Switch to Crop Planning
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `document.querySelector('button[data-tab-id="crop_planning"]').click()`
    });
    await sleep(1500);

    // Click Unsuitable filter
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Unsuitable Crops')).click()`
    });
    await sleep(1500);

    // Scroll to display reasons clearly
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `window.scrollBy({ top: 600, behavior: 'instant' })`
    });
    await sleep(1000);

    const raw = await sendCmd(ws, callbacks, 'Page.captureScreenshot', { format: 'png' });
    const data = raw?.result?.data || raw?.data;
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'crop-planning-unsuitable-reasons-expanded.png'), Buffer.from(data, 'base64'));
    console.log('Saved crop-planning-unsuitable-reasons-expanded.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch {}
    try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
    server.close();
    process.exit(0);
  }
});
