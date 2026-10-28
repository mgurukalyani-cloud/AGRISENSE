import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const LIVE_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9897',
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  LIVE_URL
]);

async function run() {
  console.log(`Starting Chrome for scrolled view verification...`);
  await new Promise(r => setTimeout(r, 4500));

  const tabs = await fetch('http://127.0.0.1:9897/json').then(r => r.json());
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

  // Skip cover page
  await send('Runtime.evaluate', {
    expression: `(() => {
      const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Skip'));
      if (skipBtn) skipBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 4000));

  // Open Voice Assistant
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*="Voice Assistant"]') ||
                  document.querySelector('button[aria-label*="Voice Assistant"]') ||
                  document.querySelector('.floating-voice-btn') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Voice Assistant') || b.textContent.includes('AI Assistant')));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // Submit: "Which irrigation zone needs water?"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]') || document.querySelector('input[placeholder*="Ask"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, "Which irrigation zone needs water?");
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = input.closest('form');
        if (form) {
          const sendBtn = form.querySelector('button[type="submit"]');
          if (sendBtn) sendBtn.click();
        }
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));

  // Scroll modal dialog down to show the full answer card, speech text, and telemetry cards
  await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.overflow-y-auto') || document.querySelector('[role="dialog"]') || document.querySelector('.max-h-\\\\[90vh\\\\]');
      if (modal) modal.scrollTop = modal.scrollHeight;
      const scrollableDivs = Array.from(document.querySelectorAll('div')).filter(d => d.scrollHeight > d.clientHeight);
      scrollableDivs.forEach(d => { d.scrollTop = d.scrollHeight; });
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Take scrolled screenshot
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const file1 = path.join(ARTIFACT_DIR, 'live-ai-assistant-answer-details.png');
  fs.writeFileSync(file1, Buffer.from(shot1.result.data, 'base64'));
  console.log('✓ Saved live scrolled answer details screenshot to:', file1);

  chrome.kill();
}

run().catch(err => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
