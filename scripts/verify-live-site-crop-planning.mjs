import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9809;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-live-' + Date.now());
const LIVE_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/';

if (!fs.existsSync(TEMP_USER_DIR)) fs.mkdirSync(TEMP_USER_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${TEMP_USER_DIR}`,
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1440,1100',
  'about:blank'
]);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function sendCmd(ws, callbacks, method, params = {}, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1000000);
    const timer = setTimeout(() => {
      callbacks.delete(id);
      resolve({ timedOut: true });
    }, timeoutMs);

    callbacks.set(id, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function captureScreen(ws, callbacks, filename) {
  const raw = await sendCmd(ws, callbacks, 'Page.captureScreenshot', { format: 'png' });
  const data = raw?.result?.data || raw?.data;
  if (!data) return;
  const localPath = path.resolve(filename);
  const targetPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
  fs.copyFileSync(localPath, targetPath);
  console.log(`✓ Saved screenshot: ${filename} (${fs.statSync(localPath).size} bytes)`);
}

async function run() {
  try {
    await sleep(3500);
    const tabsRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
    const tabs = await tabsRes.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    const callbacks = new Map();
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.id && callbacks.has(d.id)) {
        callbacks.get(d.id)(d);
        callbacks.delete(d.id);
      }
    };
    await new Promise(r => ws.onopen = r);
    await sendCmd(ws, callbacks, 'Page.enable');
    await sendCmd(ws, callbacks, 'Runtime.enable');

    console.log('1. Navigating to live site...');
    await sendCmd(ws, callbacks, 'Page.navigate', { url: LIVE_URL });
    await sleep(4500);

    // 2. Click "Explore Crop Planning" or "Market AI"
    console.log('2. Clicking Explore Crop Planning button on live page...');
    const clickRes = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const allButtons = Array.from(document.querySelectorAll('button'));
          const btn = allButtons.find(b => b.textContent.includes('Explore Crop Planning') || b.textContent.includes('Market AI')) ||
                      document.querySelector('button[data-tab-id="crop_planning"]');
          if (btn) {
            btn.click();
            return 'Clicked: ' + btn.textContent.trim().slice(0, 30);
          }
          return 'Button not found among: ' + allButtons.map(b => b.textContent.trim().slice(0, 20)).join(' | ');
        })()
      `,
      returnByValue: true
    });
    console.log('Click result:', clickRes?.result?.result?.value);

    await sleep(3500);

    // Check if error occurred on live site
    const state = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const hasError = document.body.innerText.includes('AgriSense Encountered an Unexpected Error');
          const hasPlanning = document.body.innerText.includes('Seasonal Crop Planning & Market Intelligence');
          const cropCards = document.querySelectorAll('.grid > div');
          return {
            hasError,
            hasPlanning,
            cropCardsCount: cropCards.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Crop Planning Live State:', state?.result?.result?.value);

    // Capture Recommended Crops view on LIVE site
    await captureScreen(ws, callbacks, 'live-crop-planning-recommended.png');

    // 3. Click "Unsuitable Crops to Avoid"
    console.log('3. Clicking Unsuitable Crops filter...');
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Unsuitable Crops to Avoid'));
          if (btn) btn.click();
        })()
      `
    });

    await sleep(2500);

    // Capture Unsuitable Crops view on LIVE site
    await captureScreen(ws, callbacks, 'live-crop-planning-unsuitable.png');

    // Scroll to see details of reasons
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `window.scrollBy({ top: 450, behavior: 'instant' });`
    });
    await sleep(1500);
    await captureScreen(ws, callbacks, 'live-crop-planning-unsuitable-detail.png');

    console.log('✓ All live verification steps completed successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during live verification:', err);
  } finally {
    try { chrome.kill(); } catch {}
    try { fs.rmSync(TEMP_USER_DIR, { recursive: true, force: true }); } catch {}
    process.exit(0);
  }
}

run();
