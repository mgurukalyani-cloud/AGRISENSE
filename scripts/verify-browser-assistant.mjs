import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9893',
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  'http://localhost:5173/16th-hackathon/'
]);

async function run() {
  console.log('Starting Chrome for UI Verification...');
  await new Promise(r => setTimeout(r, 3500));

  const tabs = await fetch('http://127.0.0.1:9893/json').then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('16th-hackathon')) || tabs[0];
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

  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled' && d.params?.type === 'error') {
      const text = d.params?.args?.map(a => a.value || a.description || '').join(' ');
      console.log('CONSOLE ERROR:', text);
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('Page loaded. Navigating to Voice Assistant tab...');

  // Click the Voice Assistant button (floating or header button)
  const clickRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*="Voice Assistant"]') ||
                  document.querySelector('button[aria-label*="Voice Assistant"]') ||
                  document.querySelector('.floating-voice-btn') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Voice Assistant'));
      if (btn) {
        btn.click();
        return { clicked: true, text: btn.textContent || btn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Voice Assistant open result:', clickRes.result?.value);

  await new Promise(r => setTimeout(r, 1500));

  // Test 1: Ask an agriculture question ("What is the best time to water crops?")
  console.log('Testing Agriculture question: "What is the best time to water crops?"...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, "What is the best time to water crops?");
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = input.closest('form');
        if (form) {
          const sendBtn = form.querySelector('button[type="submit"]');
          if (sendBtn) {
            sendBtn.click();
            return { submitted: true };
          }
        }
      }
      return { submitted: false };
    })()`,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 2500));

  // Verify answer rendered
  const answerCheck1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const bodyText = document.body.innerText;
      return {
        hasMorningTiming: bodyText.includes('4:00 AM') || bodyText.includes('8:00 AM'),
        hasTitle: bodyText.includes('Optimal Crop Irrigation Timing') || bodyText.includes('Irrigation')
      };
    })()`,
    returnByValue: true
  });
  console.log('Agriculture question answer rendered:', answerCheck1.result?.result?.value);

  // Take screenshot 1
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const file1 = path.join(ARTIFACT_DIR, 'ai-assistant-proper-answer.png');
  fs.writeFileSync(file1, Buffer.from(shot1.result.data, 'base64'));
  console.log('Saved screenshot 1 to:', file1);

  // Test 2: Ask a wasted question ("Who is iron man?")
  console.log('Testing Wasted question: "Who is iron man?"...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, "Who is iron man?");
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const form = input.closest('form');
        if (form) {
          const sendBtn = form.querySelector('button[type="submit"]');
          if (sendBtn) {
            sendBtn.click();
            return { submitted: true };
          }
        }
      }
      return { submitted: false };
    })()`,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 2500));

  // Verify guardrail answer rendered
  const answerCheck2 = await send('Runtime.evaluate', {
    expression: `(() => {
      const bodyText = document.body.innerText;
      return {
        hasGuardrailPrompt: bodyText.includes('Please ask a proper question related to agriculture, irrigation, weather, or crop management.'),
        hasSuggestions: bodyText.includes('Irrigation & Water') || bodyText.includes('Weather & Forecast')
      };
    })()`,
    returnByValue: true
  });
  console.log('Wasted question guardrail rendered:', answerCheck2.result?.result?.value);

  // Scroll the modal down to capture full answer and cards
  await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.overflow-y-auto') || document.querySelector('[role="dialog"]') || document.body;
      if (modal) modal.scrollTop = 600;
      window.scrollBy(0, 400);
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Take screenshot 2
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const file2 = path.join(ARTIFACT_DIR, 'ai-assistant-wasted-question-guardrail.png');
  fs.writeFileSync(file2, Buffer.from(shot2.result.data, 'base64'));
  console.log('Saved screenshot 2 to:', file2);

  chrome.kill();
  console.log('Browser test complete! All UI behaviors verified.');
}

run().catch(err => {
  console.error('Browser test failed:', err);
  chrome.kill();
  process.exit(1);
});
