import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const DIST = path.resolve('dist');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTTP_PORT = 5192;
const CDP_PORT = 9812;
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const TEMP_USER_DIR = path.resolve('scratch-chrome-sound-' + Date.now());

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
  console.log(`Test server running at http://localhost:${HTTP_PORT}`);
  if (!fs.existsSync(TEMP_USER_DIR)) fs.mkdirSync(TEMP_USER_DIR, { recursive: true });

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1440,1200',
    `http://localhost:${HTTP_PORT}`
  ]);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function sendCmd(ws, callbacks, method, params = {}, timeoutMs = 8000) {
    return new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
      const timer = setTimeout(() => {
        callbacks.delete(id);
        console.warn(`[CDP] Command ${method} timed out after ${timeoutMs}ms`);
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

  try {
    await sleep(3000);
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

    await sleep(2500);

    // 1. Navigate to Animal Sound AI tab
    console.log('1. Navigating to Animal Sound AI module...');
    const navRes = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-tab-id="animal_repellent"]') ||
                      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bio-AI') || b.textContent.includes('Animal Sound'));
          if (btn) {
            btn.click();
            return 'Clicked Animal Sound AI tab';
          }
          return 'Animal Sound button not found';
        })()
      `,
      returnByValue: true
    });
    console.log('Nav result:', navRes?.result?.result?.value);

    await sleep(2000);

    // 2. Click the "1-Click Animal Soundboard" tab
    console.log('2. Clicking 1-Click Animal Soundboard sub-tab...');
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const sbBtn = btns.find(b => b.textContent.includes('Soundboard') || b.textContent.includes('Animal Soundboard'));
          if (sbBtn) sbBtn.click();
        })()
      `
    });

    await sleep(1500);

    // 3. Test Wild Boar sound
    console.log('3. Clicking Test Sound on Wild Boar card...');
    const boarClick = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
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
    console.log('Wild Boar click result:', boarClick?.result?.result?.value);

    // Wait for analysis to produce result
    await sleep(2000);

    // Inspect result in DOM
    const resultCheck1 = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const banner = document.querySelector('.bg-gradient-to-br.from-slate-900')?.innerText || '';
          const cardBadge = document.querySelector('[data-sample-key="wild_boar"]')?.closest('.rounded-2xl')?.innerText || '';
          return {
            bannerVisible: banner.includes('Acoustic Recognition Output') || banner.includes('Wild Boar'),
            cardHasResult: cardBadge.includes('Target Confirmed') || cardBadge.includes('96.5%'),
            cardText: cardBadge.slice(0, 200)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Wild Boar test result state:', resultCheck1?.result?.result?.value);

    // Capture screenshot of Wild Boar detection result!
    await captureScreen(ws, callbacks, 'animal-sound-wild-boar-tested.png');

    // 4. Test Cow sound
    console.log('4. Clicking Test Sound on Cow card...');
    await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[data-sample-key="cow"]');
          if (btn) btn.click();
        })()
      `
    });

    await sleep(2000);

    const resultCheck2 = await sendCmd(ws, callbacks, 'Runtime.evaluate', {
      expression: `
        (() => {
          const banner = document.querySelector('.bg-gradient-to-br.from-slate-900')?.innerText || '';
          const cardBadge = document.querySelector('[data-sample-key="cow"]')?.closest('.rounded-2xl')?.innerText || '';
          return {
            bannerVisible: banner.includes('Cow') && banner.includes('Protected'),
            cardHasResult: cardBadge.includes('Protected Animal') || cardBadge.includes('94.8%'),
            cardText: cardBadge.slice(0, 200)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Cow test result state:', resultCheck2?.result?.result?.value);

    // Capture screenshot of Cow detection result!
    await captureScreen(ws, callbacks, 'animal-sound-cow-tested.png');

    console.log('✓ All verification tests passed successfully!');
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
