import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 8899;
const DOCS_DIR = path.resolve('docs');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }
  const filePath = path.join(DOCS_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // 404 fallback to index.html for SPA
    const fallback = path.join(DOCS_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(fallback).pipe(res);
  }
});

server.listen(PORT, async () => {
  console.log(`Static server running at http://localhost:${PORT}/`);

  const chromePort = 9896;
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    '--disable-gpu',
    '--no-first-run',
    `http://localhost:${PORT}/`
  ]);

  try {
    await new Promise(r => setTimeout(r, 3500));
    const tabs = await fetch(`http://127.0.0.1:${chromePort}/json`).then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes(`${PORT}`)) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let id = 0;
    const send = (method, params = {}) => new Promise(resolve => {
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

    const errors = [];
    ws.addEventListener('message', e => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled' && d.params?.type === 'error') {
        const text = d.params?.args?.map(a => a.value || a.description || '').join(' ');
        errors.push(text);
      }
      if (d.method === 'Runtime.exceptionThrown') {
        errors.push(d.params?.exceptionDetails?.text);
      }
    });

    await new Promise(r => setTimeout(r, 3000));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.getElementById('root');
        return {
          rootChildren: root ? root.children.length : 0,
          text: document.body.innerText.substring(0, 200),
          hasAgriSense: document.body.innerText.includes('AgriSense') || document.body.innerText.includes('KLH'),
          hasLogo: !!document.querySelector('img[alt*="KLH"]')
        };
      })()`,
      returnByValue: true
    });

    const val = evalRes.result?.result?.value;
    console.log('DOM Evaluation Result:', val);
    console.log('Console Errors count:', errors.length);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    if (val && val.rootChildren > 0 && val.hasAgriSense) {
      console.log('SUCCESS: Production build in docs/ mounts and renders cleanly!');
    } else {
      console.error('FAILURE: Root did not render!');
      process.exitCode = 1;
    }

    chrome.kill();
    server.close();
  } catch (err) {
    console.error('Test error:', err);
    chrome.kill();
    server.close();
    process.exit(1);
  }
});
