import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.resolve('.');
const DIST = path.join(ROOT, 'dist');
const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/9f14c222-7df9-41bc-a24b-eb5320975177';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.startsWith('/AGRISENSE/')) {
    reqPath = reqPath.replace('/AGRISENSE/', '/');
  } else if (reqPath === '/AGRISENSE') {
    reqPath = '/';
  }

  let filePath = path.join(DIST, reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4388, '127.0.0.1', async () => {
  console.log('Local preview server listening on http://127.0.0.1:4388');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9833',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1440,1050',
    'http://127.0.0.1:4388/AGRISENSE/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 4000));
    const tabs = await fetch('http://127.0.0.1:9833/json').then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes('4388')) || tabs[0];
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
    console.log('Connected to Chrome DevTools Protocol via WebSocket');

    await send('Runtime.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 2000));

    const evalCode = async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return r.result?.value;
    };

    const takeScreenshot = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res && res.result && res.result.data) {
        const outPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(outPath, Buffer.from(res.result.data, 'base64'));
        console.log(`✓ Screenshot saved: ${filename}`);
      }
    };

    // 1. Navigate to Crop Planning / Market Prices tab
    console.log('Navigating to Market Prices / Crop Planning tab...');
    await evalCode(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const planningBtn = buttons.find(b => b.textContent.includes('Market Prices') || b.textContent.includes('Crop & Mandi'));
        if (planningBtn) {
          planningBtn.click();
          return true;
        }
        return false;
      })()
    `);

    await new Promise(r => setTimeout(r, 2000));

    // Scroll to the first recommended crop card (Wheat) showing the Fertilizers Prediction row
    await evalCode(`
      (() => {
        const fertHeaders = Array.from(document.querySelectorAll('h4')).find(h => h.textContent.includes('Fertilizers Prediction'));
        if (fertHeaders) {
          fertHeaders.scrollIntoView({ behavior: 'instant', block: 'center' });
        } else {
          window.scrollBy(0, 450);
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot 1: Dedicated Fertilizers Prediction Row in Recommended Crop Card
    await takeScreenshot('live-crop-fertilizers-prediction-card.png');

    // 2. Click "Add All Fertilizers to Cart" on the Wheat card
    console.log('Adding fertilizers to cart...');
    await evalCode(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addAllBtn = buttons.find(b => b.textContent.includes('Add All Fertilizers to Cart') || b.textContent.includes('Add to Cart'));
        if (addAllBtn) {
          addAllBtn.click();
          return true;
        }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    // 3. Open Fertilizer Cart Drawer by clicking the top cart button
    console.log('Opening Fertilizer Cart Drawer...');
    await evalCode(`
      (() => {
        const cartBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Fertilizer Cart'));
        if (cartBtn) {
          cartBtn.click();
          return true;
        }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot 2: Fertilizer Cart Drawer with DBT Subsidies
    await takeScreenshot('live-fertilizer-cart-drawer.png');

    // 4. Click "Proceed to Buy" in the cart drawer
    console.log('Proceeding to Checkout...');
    await evalCode(`
      (() => {
        const buyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed to Buy'));
        if (buyBtn) {
          buyBtn.click();
          return true;
        }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot 3: Farm Delivery & Verification Checkout
    await takeScreenshot('live-fertilizer-checkout-booking.png');

    // 5. Close cart drawer and navigate to Sub-Tab 4: Cross-Crop Comparator
    console.log('Navigating to Cross-Crop Comparator...');
    await evalCode(`
      (() => {
        // Close modal first
        const closeBtn = document.querySelector('button[title="Close"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back') || b.querySelector('svg.lucide-x'));
        // Click on comparator tab
        const compBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cross-Crop Comparator') || b.textContent.includes('4. Cross-Crop'));
        if (compBtn) compBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Also close cart drawer if open
    await evalCode(`
      (() => {
        const xBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x'));
        if (xBtn) xBtn.click();
        const compBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cross-Crop Comparator') || b.textContent.includes('4. Cross-Crop'));
        if (compBtn) compBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot 4: Cross-Crop Comparator with Predicted Fertilizers
    await takeScreenshot('live-crop-comparator-fertilizers.png');

    console.log('All 4 live UI screenshots captured successfully!');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
