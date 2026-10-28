import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CDP_PORT = 9819;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-live-deploy-' + Date.now());
const TARGET_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/';

if (!fs.existsSync(TEMP_USER_DIR)) fs.mkdirSync(TEMP_USER_DIR, { recursive: true });

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${TEMP_USER_DIR}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1440,1400',
  TARGET_URL
]);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  try {
    console.log(`Connecting to Chrome at port ${CDP_PORT}...`);
    await sleep(4000);

    const tabs = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(r => r.json());
    const tab = tabs.find(t => t.url && t.url.includes('github.io')) || tabs[0];
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
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('1. Waiting 2s to check live Cover Page...');
    await sleep(2000);

    const liveCover = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const coverImg = document.querySelector('img[alt*="Fresh Farms, Healthy Lives"]');
          const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Skip to Website'));
          return {
            hasLiveCover: !!coverImg,
            skipButtonText: skipBtn ? skipBtn.textContent.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Live Cover Page Status:\n', JSON.stringify(liveCover.result.result.value, null, 2));

    // Capture screenshot of live cover
    const snapCover = await send('Page.captureScreenshot', { format: 'png' });
    const dataCover = snapCover?.result?.data || snapCover?.data;
    if (dataCover) {
      const outPath = path.join(ARTIFACT_DIR, 'live-cover-page.png');
      fs.writeFileSync(outPath, Buffer.from(dataCover, 'base64'));
      console.log(`✓ Saved live cover page screenshot to ${outPath}`);
    }

    console.log('2. Waiting 5s for cover page auto-transition on live site...');
    await sleep(5500);

    // Verify main website appeared
    const liveMain = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const logoImg = document.querySelector('img[alt="KLH Farms Logo"]');
          const logoBtn = logoImg ? logoImg.closest('button') : null;
          const extraIcon = logoBtn ? logoBtn.querySelector('.from-emerald-700') : null;
          const navItems = Array.from(document.querySelectorAll('nav[aria-label="Smart Agriculture Navigation Tabs"] button')).map(b => b.innerText.replace(/\\n/g, ' '));
          return {
            logoPresent: !!logoImg,
            logoClickable: !!logoBtn,
            extraIconRemoved: !extraIcon,
            navItemsCount: navItems.length,
            navPreview: navItems.slice(0, 5)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('\n=== LIVE MAIN SITE VERIFICATION ===\n', JSON.stringify(liveMain.result.result.value, null, 2));

    // Capture screenshot of live main home page
    const snapMain = await send('Page.captureScreenshot', { format: 'png' });
    const dataMain = snapMain?.result?.data || snapMain?.data;
    if (dataMain) {
      const outPath = path.join(ARTIFACT_DIR, 'live-home-page-redesigned.png');
      fs.writeFileSync(outPath, Buffer.from(dataMain, 'base64'));
      console.log(`✓ Saved live redesigned Home Page screenshot to ${outPath}`);
    }

    ws.close();
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    try { chrome.kill(); } catch {}
    try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
    process.exit(0);
  }
}

run();
