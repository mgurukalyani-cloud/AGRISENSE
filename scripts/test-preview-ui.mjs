import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9f14c222-7df9-41bc-a24b-eb5320975177';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.startsWith('/AGRISENSE/')) {
    reqPath = reqPath.replace('/AGRISENSE/', '/');
  } else if (reqPath === '/AGRISENSE') {
    reqPath = '/';
  }

  let filePath = path.join(DIST, reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4188, '127.0.0.1', async () => {
  console.log('Local preview server listening on http://127.0.0.1:4188');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9888',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1400,900',
    'http://127.0.0.1:4188/AGRISENSE/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 3500));
    const tabs = await fetch('http://127.0.0.1:9888/json').then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes('4188')) || tabs[0];
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

    console.log('Capturing Cover Page from production build...');
    await new Promise(r => setTimeout(r, 1500));
    const coverShot = await send('Page.captureScreenshot', { format: 'png' });
    const coverFile = path.join(ARTIFACT_DIR, 'preview-cover-page.png');
    fs.writeFileSync(coverFile, Buffer.from(coverShot.result.data, 'base64'));
    console.log('✓ Saved preview-cover-page.png to:', coverFile);

    // Skip to Home Page
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Skip'));
        if (btn) btn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('Capturing Home Page Header & Layout from production build...');
    const homeShot = await send('Page.captureScreenshot', { format: 'png' });
    const homeFile = path.join(ARTIFACT_DIR, 'preview-home-header.png');
    fs.writeFileSync(homeFile, Buffer.from(homeShot.result.data, 'base64'));
    console.log('✓ Saved preview-home-header.png to:', homeFile);

    // Verify logo and cover image elements
    const checkRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const logo = document.querySelector('img[alt="KLH Farms Logo"]');
        return {
          logoFound: Boolean(logo),
          logoNaturalWidth: logo ? logo.naturalWidth : 0,
          logoComplete: logo ? logo.complete : false,
          logoSrc: logo ? logo.src : ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Header logo check:', checkRes.result?.value || checkRes.result);

    chrome.kill();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during preview test:', err);
    chrome.kill();
    server.close();
    process.exit(1);
  }
});
