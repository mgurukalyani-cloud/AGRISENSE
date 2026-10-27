import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('dist');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTTP_PORT = 5179;
const CDP_PORT = 9792;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-crops-' + Date.now());

// 1. Static file server for dist
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  // Strip subpath if needed
  reqPath = reqPath.replace(/^\/AGRISENSE\/?/, '/');
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  
  let filePath = path.join(DIST, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(HTTP_PORT, async () => {
  console.log(`Preview server running at http://localhost:${HTTP_PORT}`);

  if (!fs.existsSync(TEMP_USER_DIR)) {
    fs.mkdirSync(TEMP_USER_DIR, { recursive: true });
  }

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

  async function captureScreen(ws, callbacks, filename) {
    const raw = await sendCmd(ws, callbacks, 'Page.captureScreenshot', { format: 'png' });
    const data = raw?.result?.data || raw?.data;
    const localPath = path.resolve(filename);
    const targetPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    fs.copyFileSync(localPath, targetPath);
    console.log(`Saved screenshot: ${filename} (${fs.statSync(localPath).size} bytes)`);
  }

  try {
    await sleep(3500);
    const tabsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const tabs = await tabsRes.json();
    const pageTab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    const callbacks = new Map();
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data);
        callbacks.delete(data.id);
      }
    };

    await new Promise(r => ws.onopen = r);
    await sendCmd(ws, callbacks, 'Page.enable');
    await sendCmd(ws, callbacks, 'Runtime.enable');

    await sleep(2000);

    // 1. Navigate to Crop Planning Tab
    console.log('Navigating to Crop Planning tab...');
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const cropBtn = btns.find(b => b.textContent.includes('Crop Planning') || b.textContent.includes('Crop Plan'));
          if (cropBtn) {
            cropBtn.click();
            return 'Clicked Crop Planning Tab';
          }
          return 'Crop Planning button not found';
        })()
      `
    });

    await sleep(2000);

    // Capture Recommended Crops view with actual photos
    await captureScreen(ws, callbacks, 'crop-planning-recommended-with-photos.png');

    // 2. Click "Unsuitable Crops to Avoid" Filter Pill
    console.log('Clicking Unsuitable Crops filter...');
    const clickRes = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const unsuitableBtn = btns.find(b => b.textContent.includes('Unsuitable Crops to Avoid'));
          if (unsuitableBtn) {
            unsuitableBtn.click();
            return 'Clicked Unsuitable Crops filter';
          }
          return 'Unsuitable button not found';
        })()
      `
    });
    console.log('Filter click result:', clickRes?.result?.value);

    await sleep(2000);

    // Capture Unsuitable Crops view with reasons & photos
    await captureScreen(ws, callbacks, 'crop-planning-unsuitable-with-reasons.png');

    // 3. Scroll down to inspect reasons on multiple cards
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `window.scrollBy({ top: 500, behavior: 'instant' });`
    });
    await sleep(1000);
    await captureScreen(ws, callbacks, 'crop-planning-unsuitable-scrolled.png');

    console.log('Verification completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    try { chrome.kill(); } catch {}
    try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
    server.close();
    process.exit(0);
  }
});
