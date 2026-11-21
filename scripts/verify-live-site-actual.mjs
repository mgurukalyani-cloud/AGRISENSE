import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9f14c222-7df9-41bc-a24b-eb5320975177';
const LIVE_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/?v=' + Date.now();

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9855',
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  LIVE_URL
]);

async function run() {
  console.log('Connecting to live site: ' + LIVE_URL);
  await new Promise(r => setTimeout(r, 4500));

  const tabs = await fetch('http://127.0.0.1:9855/json').then(r => r.json());
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

  await new Promise(r => setTimeout(r, 3000));

  console.log('Capturing live site screenshot...');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const shotFile = path.join(ARTIFACT_DIR, 'live-site-actual-verified.png');
  fs.writeFileSync(shotFile, Buffer.from(shot.result.data, 'base64'));
  console.log('✓ Saved live screenshot to:', shotFile);

  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        url: window.location.href,
        hasCoverPage: text.includes('Skip to Website') || text.includes('Launching in'),
        hasKlhLogo: Boolean(document.querySelector('img[alt*="KLH"]')),
        hasWeatherOverviewCard: text.includes('Weather Overview'),
        hasAnimalSoundCard: text.includes('Animal Sound AI'),
        hasAgriSense: text.includes('AgriSense')
      };
    })()`,
    returnByValue: true
  });
  console.log('Live Verification details:', evalRes.result?.value || evalRes.result);

  chrome.kill();
  console.log('\n=== LIVE VERIFICATION COMPLETED! ===');
}

run().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
