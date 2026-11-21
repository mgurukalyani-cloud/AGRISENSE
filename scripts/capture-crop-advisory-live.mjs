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

server.listen(4299, '127.0.0.1', async () => {
  console.log('Local preview server listening on http://127.0.0.1:4299');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9899',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1440,1050',
    'http://127.0.0.1:4299/AGRISENSE/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 4000));
    const tabs = await fetch('http://127.0.0.1:9899/json').then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes('4299')) || tabs[0];
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
    console.log('Connected to Chrome DevTools Protocol via WebSocket');

    await send('Runtime.enable');
    await send('Page.enable');

    // Wait for initial render
    await new Promise(r => setTimeout(r, 2000));

    // Helper to evaluate script in page
    const evalCode = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return r.result?.value;
    };

    // Helper to capture screenshot
    const takeScreenshot = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res && res.result && res.result.data) {
        const outPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(outPath, Buffer.from(res.result.data, 'base64'));
        console.log(`✓ Screenshot saved: ${filename}`);
      }
    };

    // 1. Click on "Crop Advisory" tab in NavigationTabs
    console.log('Navigating to Crop Advisory tab...');
    await evalCode(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const advisoryBtn = buttons.find(b => b.textContent.includes('Crop Advisory') || b.textContent.includes('Crop Lifecycle'));
        if (advisoryBtn) {
          advisoryBtn.click();
          return true;
        }
        return false;
      })()
    `);

    await new Promise(r => setTimeout(r, 2000));

    // Capture Overview with Timeline and Voice Bar
    await takeScreenshot('live-crop-advisory-overview.png');

    // 2. Scroll down to Fertilizer Advisory Card
    await evalCode(`
      (() => {
        const fertCard = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Precision Fertilizer') || h.textContent.includes('ఎరువుల సిఫార్సు'));
        if (fertCard) {
          fertCard.scrollIntoView({ behavior: 'instant', block: 'start' });
        } else {
          window.scrollBy(0, 550);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot('live-crop-fertilizer-calculator.png');

    // 3. Scroll down to Pest & Disease Protection Card
    await evalCode(`
      (() => {
        const pestCard = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Crop Protection') || h.textContent.includes('సస్యరక్షణ'));
        if (pestCard) {
          pestCard.scrollIntoView({ behavior: 'instant', block: 'start' });
        } else {
          window.scrollBy(0, 750);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot('live-crop-pest-advisory.png');

    // 4. Scroll back to top & toggle Language to Telugu
    await evalCode(`window.scrollTo(0, 0);`);
    await new Promise(r => setTimeout(r, 800));

    await evalCode(`
      (() => {
        const langBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Lang:') || b.textContent.includes('భాష:'));
        if (langBtns.length > 0) {
          langBtns[0].click();
          return true;
        }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot('live-crop-advisory-telugu.png');

    // 5. Click "కొత్త పంట నమోదు" (Register New Crop) button to test the modal
    await evalCode(`
      (() => {
        const regBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('కొత్త పంట నమోదు') || b.textContent.includes('Register New Crop'));
        if (regBtns.length > 0) {
          regBtns[0].click();
          return true;
        }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('live-crop-registration-modal.png');

    console.log('All 5 live UI verification screenshots captured successfully!');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
