import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9891',
  '--disable-gpu',
  '--no-first-run',
  'http://localhost:5173/16th-hackathon/'
]);

async function run() {
  await new Promise(r => setTimeout(r, 3500));
  const tabs = await fetch('http://127.0.0.1:9891/json').then(r => r.json());
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
    if (d.method === 'Runtime.consoleAPICalled') {
      const type = d.params?.type;
      const text = d.params?.args?.map(a => a.value || a.description || '').join(' ');
      if (type === 'error') {
        console.log('BROWSER CONSOLE ERROR:', text);
      }
    }
    if (d.method === 'Runtime.exceptionThrown') {
      console.log('BROWSER EXCEPTION:', d.params?.exceptionDetails?.text, d.params?.exceptionDetails?.exception?.description);
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('1. Page loaded. Now clicking animal_repellent tab button...');
  await send('Runtime.evaluate', {
    expression: 'document.querySelector("button[data-tab-id=\\"animal_repellent\\"]")?.click()'
  });

  await new Promise(r => setTimeout(r, 3000));

  const check = await send('Runtime.evaluate', {
    expression: 'document.body.innerText.slice(0, 500)'
  });
  console.log('Body after click:\n', check?.result?.result?.value);

  const errorBoundary = await send('Runtime.evaluate', {
    expression: 'Boolean(document.body.innerText.includes("AgriSense Encountered an Unexpected Error"))'
  });
  console.log('Has Error Boundary after click?:', errorBoundary?.result?.result?.value);

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
