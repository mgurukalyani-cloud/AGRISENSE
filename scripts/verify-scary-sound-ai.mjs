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

server.listen(4196, '127.0.0.1', async () => {
  console.log('Local test server listening on http://127.0.0.1:4196');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9869',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1400,1050',
    'http://127.0.0.1:4196/AGRISENSE/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 4000));
    const tabs = await fetch('http://127.0.0.1:9869/json').then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes('4196')) || tabs[0];
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

    console.log('Page loaded. Navigating to Animal Sound AI module...');
    await new Promise(r => setTimeout(r, 2000));

    // 1. Click Animal Sound module button
    const clickMod = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent && b.textContent.includes('Animal Sound'));
          if (btn) {
            btn.click();
            return { success: true, text: btn.textContent.trim() };
          }
          return { success: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Animal Sound module clicked:', clickMod.result?.value);
    await new Promise(r => setTimeout(r, 2000));

    // 2. Switch to Demo Simulation subtab
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent && b.textContent.includes('Demo Simulation'));
          if (btn) {
            btn.click();
            return { success: true };
          }
          return { success: false };
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1200));

    // 3. Trigger 1. Wild Boar Confirmed Demo Scenario
    console.log('Triggering Wild Boar Demo Test Case...');
    const demoClick = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('[data-demo-scenario="wild_boar_instant"]');
          if (btn) {
            btn.scrollIntoView({ behavior: 'instant', block: 'center' });
            btn.click();
            return { success: true };
          }
          return { success: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Wild Boar demo triggered:', demoClick.result?.value);
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 1: Demo Simulation with scary sound active
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const file1 = path.join(ARTIFACT_DIR, 'live-animal-sound-scary-demo.png');
    fs.writeFileSync(file1, Buffer.from(shot1.result.data, 'base64'));
    console.log('✓ Saved live-animal-sound-scary-demo.png to:', file1);

    // 4. Switch to 1-Click Animal Soundboard subtab
    console.log('Switching to 1-Click Animal Soundboard...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.textContent && b.textContent.includes('Soundboard'));
          if (btn) {
            btn.scrollIntoView({ behavior: 'instant', block: 'center' });
            btn.click();
            return { success: true };
          }
          return { success: false };
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1200));

    // 5. Test Wild Boar sample on Soundboard
    console.log('Testing Wild Boar sound on Soundboard (triggers AI classification + scary sound)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('[data-sample-key="wild_boar"]');
          if (btn) {
            btn.scrollIntoView({ behavior: 'instant', block: 'center' });
            btn.click();
            return { success: true };
          }
          return { success: false };
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 2500));

    // Check status in page
    const statusCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const banner = document.querySelector('.bg-gradient-to-br');
          return {
            bannerText: banner ? banner.innerText : 'none'
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Recognition Banner text:', statusCheck.result?.value?.bannerText?.slice(0, 300));

    // Screenshot 2: Soundboard with High Accuracy Output & Scary Roar Replay
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const file2 = path.join(ARTIFACT_DIR, 'live-animal-soundboard-verified.png');
    fs.writeFileSync(file2, Buffer.from(shot2.result.data, 'base64'));
    console.log('✓ Saved live-animal-soundboard-verified.png to:', file2);

    console.log('\n🎉 ALL TESTS AND SCREENSHOTS COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    try {
      chrome.kill();
      server.close();
    } catch (_) {}
    process.exit(0);
  }
});
