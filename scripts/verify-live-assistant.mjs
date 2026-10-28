import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177';
const LIVE_URL = 'https://mgurukalyani-cloud.github.io/AGRISENSE/';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9895',
  '--disable-gpu',
  '--no-first-run',
  '--window-size=1400,900',
  LIVE_URL
]);

async function run() {
  console.log(`Starting Chrome to verify live deployment: ${LIVE_URL}...`);
  await new Promise(r => setTimeout(r, 4500));

  const tabs = await fetch('http://127.0.0.1:9895/json').then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('AGRISENSE')) || tabs[0];
  if (!pageTab) {
    throw new Error('Could not find AGRISENSE tab in Chrome');
  }

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
      console.log('[BROWSER CONSOLE ERROR]:', text);
    }
  });

  console.log('Checking cover page & waiting for main app...');
  // Handle cover page if present
  await send('Runtime.evaluate', {
    expression: `(() => {
      const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Skip'));
      if (skipBtn) skipBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 4000));

  // Open Voice Assistant
  console.log('Opening AI Assistant...');
  const openRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*="Voice Assistant"]') ||
                  document.querySelector('button[aria-label*="Voice Assistant"]') ||
                  document.querySelector('.floating-voice-btn') ||
                  Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Voice Assistant') || b.textContent.includes('AI Assistant')));
      if (btn) {
        btn.click();
        return { clicked: true, text: btn.textContent || btn.title };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('AI Assistant open button click result:', openRes.result?.value);

  await new Promise(r => setTimeout(r, 2000));

  // Test 1: "Which irrigation zone needs water?"
  console.log('Submitting question: "Which irrigation zone needs water?"...');
  const submitRes1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]') || document.querySelector('input[placeholder*="Ask"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, "Which irrigation zone needs water?");
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
  console.log('Submission 1 result:', submitRes1.result?.value);

  await new Promise(r => setTimeout(r, 3000));

  // Check state and content
  const stateCheck1 = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText;
      return {
        has405Error: body.includes('status 405') || body.includes('Error encountered'),
        hasTitle: body.includes('Irrigation Status') || body.includes('Farm Irrigation'),
        hasZone2: body.includes('Zone 2'),
        hasSpeechText: body.includes('soil moisture at 28 percent') || body.includes('needs water'),
        snippet: body.substring(0, 300)
      };
    })()`,
    returnByValue: true
  });
  console.log('Verification 1 details:', stateCheck1.result?.value);

  // Take screenshot 1
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const file1 = path.join(ARTIFACT_DIR, 'live-ai-assistant-irrigation-zone.png');
  fs.writeFileSync(file1, Buffer.from(shot1.result.data, 'base64'));
  console.log('✓ Saved live irrigation answer screenshot to:', file1);

  // Test 2: "Who is the president of USA?" (Off-topic question)
  console.log('\nSubmitting off-topic question: "Who is the president of USA?"...');
  const submitRes2 = await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="text"]') || document.querySelector('input[placeholder*="Ask"]');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, "Who is the president of USA?");
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
  console.log('Submission 2 result:', submitRes2.result?.value);

  await new Promise(r => setTimeout(r, 3000));

  const stateCheck2 = await send('Runtime.evaluate', {
    expression: `(() => {
      const body = document.body.innerText;
      return {
        hasGuardrail: body.includes('Please Ask an Agriculture or Weather Question') || body.includes('Please ask a proper question related to agriculture'),
        hasSuggestions: body.includes('Irrigation & Water') || body.includes('Weather & Forecast')
      };
    })()`,
    returnByValue: true
  });
  console.log('Verification 2 details (off-topic guardrail):', stateCheck2.result?.value);

  // Take screenshot 2
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const file2 = path.join(ARTIFACT_DIR, 'live-ai-assistant-guardrail.png');
  fs.writeFileSync(file2, Buffer.from(shot2.result.data, 'base64'));
  console.log('✓ Saved live guardrail screenshot to:', file2);

  chrome.kill();
  console.log('\n=== LIVE VERIFICATION FINISHED SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error('Live verification failed:', err);
  chrome.kill();
  process.exit(1);
});
