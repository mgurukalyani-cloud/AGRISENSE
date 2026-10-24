import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9799;

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--window-size=1440,1100',
  'http://localhost:5173/16th-hackathon/'
]);

setTimeout(async () => {
  const tabs = await fetch(`http://127.0.0.1:${PORT}/json`).then(r => r.json());
  const pageTab = tabs.find(t => t.url && t.url.includes('16th-hackathon')) || tabs[0];
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 0;
  const send = (method, params = {}) => new Promise(res => {
    const id = ++msgId;
    const onMsg = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === id) {
        ws.removeEventListener('message', onMsg);
        res(d);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });

  // Navigate to Animal Sound AI tab
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("button[data-tab-id=\\"animal_repellent\\"]").click()'
  });
  await new Promise(r => setTimeout(r, 2000));

  // Open Hardware Schematic modal
  await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("button")).find(b => b.innerText.includes("ESP32 Hardware Schematic")).click()'
  });
  await new Promise(r => setTimeout(r, 1500));

  // Capture screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('animal-repellent-hardware-modal.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Successfully saved animal-repellent-hardware-modal.png');

  // Copy to brain artifacts
  fs.copyFileSync('animal-repellent-hardware-modal.png', 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9f14c222-7df9-41bc-a24b-eb5320975177\\animal-repellent-hardware-modal.png');

  chrome.kill();
  process.exit(0);
}, 4500);
