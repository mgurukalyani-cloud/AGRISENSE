import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('dist');
const HTTP_PORT = 5198;
const CDP_PORT = 9818;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-features-' + Date.now());

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav'
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
  console.log(`Server listening on http://localhost:${HTTP_PORT}`);
  if (!fs.existsSync(TEMP_USER_DIR)) fs.mkdirSync(TEMP_USER_DIR, { recursive: true });

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1440,1400',
    `http://localhost:${HTTP_PORT}`
  ]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    await sleep(3500);
    const tabs = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes(String(HTTP_PORT))) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

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
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('1. Checking Cover Page immediately upon load...');
    await sleep(1500);

    // Verify Cover Page presence
    const coverCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const coverImg = document.querySelector('img[alt*="Fresh Farms, Healthy Lives"]');
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Skip to Website'));
          return {
            hasCoverPage: !!coverImg,
            coverSrc: coverImg ? coverImg.src : null,
            skipButtonText: skipBtn ? skipBtn.textContent.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Cover Page Check:\n', JSON.stringify(coverCheck?.result?.result?.value, null, 2));

    // Capture screenshot of Cover Page
    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    const data1 = snap1?.result?.data || snap1?.data;
    if (data1) {
      const outPath = path.join(ARTIFACT_DIR, 'cover-page-verified.png');
      fs.writeFileSync(outPath, Buffer.from(data1, 'base64'));
      console.log(`✓ Saved Cover Page screenshot to ${outPath}`);
    }

    // Wait for the 5-second automatic countdown to complete
    console.log('2. Waiting 5.5s for Cover Page to automatically transition to Main Website...');
    await sleep(5500);

    // Verify Cover Page has auto-dismissed
    const afterCoverCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const coverImg = document.querySelector('img[alt*="Fresh Farms, Healthy Lives"]');
          return { coverDismissed: !coverImg };
        })()
      `,
      returnByValue: true
    });
    console.log('After 5s Cover Check:', JSON.stringify(afterCoverCheck?.result?.result?.value, null, 2));

    await sleep(2000);

    // 3. Verify Header Logo and Extra Icon Removal
    console.log('3. Verifying Header Logo and Extra Icon removal...');
    const headerCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const logoImg = document.querySelector('img[alt="KLH Farms Logo"]');
          const logoBtn = logoImg ? logoImg.closest('button') : null;
          // Check if any second sprout icon is in the logo container
          const extraSprout = logoBtn ? logoBtn.querySelector('.from-emerald-700') : null;
          return {
            hasLogo: !!logoImg,
            isClickable: !!logoBtn,
            logoTitle: logoBtn ? logoBtn.title : null,
            hasExtraIcon: !!extraSprout
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Header Logo Check:\n', JSON.stringify(headerCheck?.result?.result?.value, null, 2));

    // 4. Verify Navigation Bar tabs and labels
    console.log('4. Verifying Navigation Bar tabs...');
    const navCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navButtons = Array.from(document.querySelectorAll('nav[aria-label="Smart Agriculture Navigation Tabs"] button'));
          return navButtons.map(b => ({
            id: b.getAttribute('data-tab-id'),
            text: b.innerText.replace(/\\n/g, ' • ')
          }));
        })()
      `,
      returnByValue: true
    });
    console.log('Navigation Tabs:\n', JSON.stringify(navCheck?.result?.result?.value, null, 2));

    // 5. Test Clickable Logo: Switch tab to Animal Sound AI, then click Logo
    console.log('5. Testing Clickable Logo redirection...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-tab-id="animal_repellent"]').click()`
    });
    await sleep(1500);

    const activeBeforeClick = await send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-tab-id="animal_repellent"]').classList.contains('text-white')`,
      returnByValue: true
    });
    console.log('Switched to Animal Sound tab:', activeBeforeClick?.result?.result?.value);

    // Now click the KLH Farms logo button
    await send('Runtime.evaluate', {
      expression: `document.querySelector('img[alt="KLH Farms Logo"]').closest('button').click()`
    });
    await sleep(1500);

    const activeAfterClick = await send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-tab-id="overview"]').classList.contains('text-white')`,
      returnByValue: true
    });
    console.log('Redirected back to Home Overview upon logo click:', activeAfterClick?.result?.result?.value);

    // 6. Capture full screenshot of redesigned Home page
    const snap2 = await send('Page.captureScreenshot', { format: 'png' });
    const data2 = snap2?.result?.data || snap2?.data;
    if (data2) {
      const outPath = path.join(ARTIFACT_DIR, 'home-page-redesigned.png');
      fs.writeFileSync(outPath, Buffer.from(data2, 'base64'));
      console.log(`✓ Saved redesigned Home Page screenshot to ${outPath}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    try { chrome.kill(); } catch {}
    try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
    server.close();
    process.exit(0);
  }
});
