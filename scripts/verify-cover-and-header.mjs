import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9f14c222-7df9-41bc-a24b-eb5320975177';
const LIVE_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/?v=' + Date.now();

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9899',
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  LIVE_URL
]);

async function run() {
  console.log('Starting Chrome for live Cover Page & Header verification...');
  await new Promise(r => setTimeout(r, 4500));

  const tabs = await fetch('http://127.0.0.1:9899/json').then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('AGRISENSE')) || tabs[0];
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

  // Wait 1.5 seconds to capture Cover Page while it's active
  await new Promise(r => setTimeout(r, 1500));

  console.log('Capturing Cover Page screenshot...');
  const coverShot = await send('Page.captureScreenshot', { format: 'png' });
  const coverFile = path.join(ARTIFACT_DIR, 'live-cover-page-verified.png');
  fs.writeFileSync(coverFile, Buffer.from(coverShot.result.data, 'base64'));
  console.log('✓ Saved Cover Page screenshot to:', coverFile);

  // Check if cover image loaded successfully
  const coverImgCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const img = document.querySelector('img[alt*="KLH Farms"]');
      if (!img) return { found: false };
      return {
        found: true,
        src: img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      };
    })()`,
    returnByValue: true
  });
  console.log('Cover image check:', coverImgCheck.result?.result?.value);

  // Skip or wait for cover page to finish
  await send('Runtime.evaluate', {
    expression: `(() => {
      const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Skip'));
      if (skipBtn) skipBtn.click();
    })()`
  });

  // Wait for transition to Home page
  await new Promise(r => setTimeout(r, 2000));

  console.log('Capturing Home Page Header screenshot...');
  const homeShot = await send('Page.captureScreenshot', { format: 'png' });
  const homeFile = path.join(ARTIFACT_DIR, 'live-home-header-verified.png');
  fs.writeFileSync(homeFile, Buffer.from(homeShot.result.data, 'base64'));
  console.log('✓ Saved Home Page Header screenshot to:', homeFile);

  // Check header logo image
  const logoCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const logoImg = document.querySelector('img[alt="KLH Farms Logo"]');
      if (!logoImg) return { found: false };
      return {
        found: true,
        src: logoImg.src,
        naturalWidth: logoImg.naturalWidth,
        naturalHeight: logoImg.naturalHeight,
        complete: logoImg.complete
      };
    })()`,
    returnByValue: true
  });
  console.log('Header logo check:', logoCheck.result?.result?.value);

  chrome.kill();
  console.log('\n=== VERIFICATION FINISHED ===');
}

run().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
