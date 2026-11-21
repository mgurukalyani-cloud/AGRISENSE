import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactPath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177\\live-chatbot-interface-open.png';
const tempDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\agrisense-weather\\scratch-chrome-cdp-ai';

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9333',
  '--user-data-dir=' + tempDir,
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1440,1050',
  'https://mgurukalyani-cloud.github.io/AGRISENSE/'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9333/json');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('No page target');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((res) => {
        const msgId = id++;
        const handler = (event) => {
          const parsed = JSON.parse(event.data);
          if (parsed.id === msgId) {
            ws.removeEventListener('message', handler);
            res(parsed.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.addEventListener('open', async () => {
      await send('Page.enable');
      await send('Runtime.enable');
      await new Promise(r => setTimeout(r, 4000));

      // Click AI Assistant tab
      const clickRes = await send('Runtime.evaluate', {
        expression: `
          const btn = document.querySelector('[data-tab-id="voice_assistant"]');
          if (btn) { btn.click(); 'clicked'; } else { 'not_found'; }
        `
      });
      console.log('Click result:', clickRes);

      await new Promise(r => setTimeout(r, 2000));

      const ss = await send('Page.captureScreenshot', { format: 'png' });
      if (ss && ss.data) {
        fs.writeFileSync(artifactPath, Buffer.from(ss.data, 'base64'));
        console.log('Saved screenshot! Size:', fs.statSync(artifactPath).size);
      }
      ws.close();
      chromeProc.kill();
    });
  } catch (err) {
    console.error('CDP Error:', err.message);
    chromeProc.kill();
  }
}, 3000);
