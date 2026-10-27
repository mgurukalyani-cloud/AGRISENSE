import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('dist');
const HTTP_PORT = 5195;
const CDP_PORT = 9815;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-test-' + Date.now());

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

    console.log('1. Waiting 3s for app initialization...');
    await sleep(3000);

    // 2. Click animal_repellent tab
    console.log('2. Clicking Animal Sound tab...');
    const clickTab = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-tab-id="animal_repellent"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bio-AI'));
          if (btn) {
            btn.click();
            return 'Clicked: ' + btn.textContent.trim().slice(0, 30);
          }
          return 'Not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Tab click:', clickTab?.result?.result?.value);

    await sleep(2000);

    // 3. Switch to 1-Click Animal Soundboard sub-tab
    console.log('3. Clicking 1-Click Animal Soundboard subtab...');
    const clickSub = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Soundboard'));
          if (btn) {
            btn.click();
            return 'Clicked Soundboard tab';
          }
          return 'Soundboard sub-tab not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Sub-tab click:', clickSub?.result?.result?.value);

    await sleep(1500);

    // 4. Click Test Sound on Wild Boar
    console.log('4. Clicking Test Sound on Wild Boar card...');
    const testBoar = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-sample-key="wild_boar"]');
          if (btn) {
            btn.click();
            return 'Clicked Wild Boar Test Sound';
          }
          return 'Wild Boar button not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Boar test:', testBoar?.result?.result?.value);

    await sleep(2500);

    // 5. Click Test Sound on Cow
    console.log('5. Clicking Test Sound on Cow card...');
    const testCow = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-sample-key="cow"]');
          if (btn) {
            btn.click();
            return 'Clicked Cow Test Sound';
          }
          return 'Cow button not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Cow test:', testCow?.result?.result?.value);

    await sleep(2500);

    // 6. Check DOM for results
    const checkDom = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const banner = document.querySelector('.border-emerald-500\\\\/30');
          const boarCard = document.querySelector('[data-sample-key="wild_boar"]')?.closest('.rounded-2xl');
          const cowCard = document.querySelector('[data-sample-key="cow"]')?.closest('.rounded-2xl');
          return {
            hasOutputBanner: !!banner,
            bannerTitle: banner ? banner.querySelector('h4')?.innerText : 'No banner',
            bannerStatus: banner ? banner.querySelector('p')?.innerText : '',
            boarCardHasResult: boarCard ? (boarCard.innerText.includes('Target Confirmed') || boarCard.innerText.includes('96.5%')) : false,
            cowCardHasResult: cowCard ? (cowCard.innerText.includes('Protected') || cowCard.innerText.includes('94.8%')) : false,
            boarSnippet: boarCard ? boarCard.innerText : '',
            cowSnippet: cowCard ? cowCard.innerText : ''
          };
        })()
      `,
      returnByValue: true
    });
    console.log('\n=== DOM TEST RESULTS ===\n', JSON.stringify(checkDom?.result?.result?.value, null, 2));

    // 7. Scroll to show both the output banner and the cards cleanly
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('h3');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await sleep(1000);

    // 8. Capture Screenshot
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const data = snap?.result?.data || snap?.data;
    if (data) {
      const outPath = path.join(ARTIFACT_DIR, 'animal-soundboard-tested-live.png');
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`\n✓ Saved screenshot to ${outPath} (${fs.statSync(outPath).size} bytes)`);
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
