import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CDP_PORT = 9817;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-live-' + Date.now());
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

    console.log('1. Waiting 5s for live site to load...');
    await sleep(5000);

    // Click animal repellent tab
    console.log('2. Switching to Animal Sound tab on live site...');
    const tabClick = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-tab-id="animal_repellent"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bio-AI'));
          if (btn) {
            btn.click();
            return 'Switched tab: ' + btn.textContent.trim().slice(0, 30);
          }
          return 'Tab not found';
        })()
      `,
      returnByValue: true
    });
    console.log(tabClick.result.result.value);

    await sleep(2500);

    // Switch to Soundboard subtab
    console.log('3. Switching to 1-Click Animal Soundboard subtab...');
    const subClick = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Soundboard'));
          if (btn) {
            btn.click();
            return 'Switched subtab';
          }
          return 'Soundboard not found';
        })()
      `,
      returnByValue: true
    });
    console.log(subClick.result.result.value);

    await sleep(2000);

    // Click Test Sound on Wild Boar
    console.log('4. Clicking Test Sound on Wild Boar...');
    const boarClick = await send('Runtime.evaluate', {
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
    console.log(boarClick.result.result.value);

    await sleep(3000);

    // Click Test Sound on Cow
    console.log('5. Clicking Test Sound on Cow...');
    const cowClick = await send('Runtime.evaluate', {
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
    console.log(cowClick.result.result.value);

    await sleep(3000);

    // Inspect live DOM
    const domCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const banner = document.querySelector('.border-emerald-500\\\\/30');
          const boarCard = document.querySelector('[data-sample-key="wild_boar"]')?.closest('.rounded-2xl');
          const cowCard = document.querySelector('[data-sample-key="cow"]')?.closest('.rounded-2xl');
          return {
            hasLiveOutputBanner: !!banner,
            bannerTitle: banner ? banner.querySelector('h4')?.innerText : 'No banner',
            bannerAction: banner ? banner.querySelector('span.px-3')?.innerText : '',
            boarStatus: boarCard ? boarCard.innerText : '',
            cowStatus: cowCard ? cowCard.innerText : ''
          };
        })()
      `,
      returnByValue: true
    });
    console.log('\n=== LIVE GITHUB PAGES DOM TEST RESULTS ===\n', JSON.stringify(domCheck.result.result.value, null, 2));

    // Scroll into view for clear screenshot
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('h3');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()
      `
    });
    await sleep(1000);

    // Capture screenshot of live production site
    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const data = snap?.result?.data || snap?.data;
    if (data) {
      const outPath = path.join(ARTIFACT_DIR, 'live-site-animal-sound-tested.png');
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`\n✓ Saved live site screenshot to ${outPath} (${fs.statSync(outPath).size} bytes)`);
    }

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    try { chrome.kill(); } catch {}
    try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
    process.exit(0);
  }
}

run();
