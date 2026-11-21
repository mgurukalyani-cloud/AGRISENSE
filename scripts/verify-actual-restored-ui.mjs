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

server.listen(4195, '127.0.0.1', async () => {
  console.log('Local test server listening on http://127.0.0.1:4195');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9866',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1400,900',
    'http://127.0.0.1:4195/AGRISENSE/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 3500));
    const tabs = await fetch('http://127.0.0.1:9866/json').then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes('4195')) || tabs[0];
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

    console.log('Capturing restored actual website (Image 2)...');
    await new Promise(r => setTimeout(r, 2000));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const file1 = path.join(ARTIFACT_DIR, 'actual-website-overview.png');
    fs.writeFileSync(file1, Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ Saved actual-website-overview.png to:', file1);

    // Click on "Animal Sound AI" tab to match Image 2 exactly
    console.log('Clicking Animal Sound AI tab...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('[data-tab-id="animal_repellent"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Animal Sound AI'));
        if (btn) btn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 1500));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const file2 = path.join(ARTIFACT_DIR, 'actual-website-animal-sound-tab.png');
    fs.writeFileSync(file2, Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ Saved actual-website-animal-sound-tab.png to:', file2);

    // Verify UI state
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasCoverPage: text.includes('Skip to Website') || text.includes('Launching in'),
          hasKlhLogo: Boolean(document.querySelector('img[alt*="KLH"]')),
          hasKlhText: text.includes('KLH FARMS') || text.includes('KLH Farms'),
          hasAgriSense: text.includes('AgriSense'),
          hasWeatherOverviewCard: text.includes('Weather Overview') && text.includes('Dashboard & Metrics'),
          hasAnimalSoundCard: text.includes('Animal Sound AI') && text.includes('Bio-Acoustic Defense'),
          hasVoiceAssistantCard: text.includes('Voice Assistant') && text.includes('22 Languages'),
          hasPlatformModulesBtn: text.includes('Platform Modules')
        };
      })()`,
      returnByValue: true
    });
    console.log('UI Verification:', evalRes.result?.value || evalRes.result);

    chrome.kill();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    chrome.kill();
    server.close();
    process.exit(1);
  }
});
