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

server.listen(4390, '127.0.0.1', async () => {
  console.log('Local preview server listening on http://127.0.0.1:4390');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9840',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1440,1050',
    'http://127.0.0.1:4390/AGRISENSE/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 4000));
    const tabs = await fetch('http://127.0.0.1:9840/json').then(r => r.json());
    const pageTab = tabs.find(t => t.url && t.url.includes('4390')) || tabs[0];
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

    // 1. Navigate to Agri Store tab
    console.log('Navigating to Agri Store tab...');
    await evalCode(`
      (() => {
        const btn = document.querySelector('button[data-tab-id="store"]') || 
          Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Agri Store'));
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 2000));

    // Capture 1: Store Page
    await takeScreenshot('live-agrisense-store-page.png');

    // 2. Click "Add to Cart" on first product
    console.log('Adding product to cart...');
    await evalCode(`
      (() => {
        const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Add to Cart'));
        if (addBtns.length > 0) {
          addBtns[0].click();
          if (addBtns.length > 1) addBtns[1].click();
          return true;
        }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    // 3. Open Shopping Cart Drawer
    console.log('Opening Shopping Cart Drawer...');
    await evalCode(`
      (() => {
        const cartBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cart ('));
        if (cartBtn) { cartBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture 2: Cart Drawer
    await takeScreenshot('live-store-shopping-cart.png');

    // 4. Click "Proceed to Checkout"
    console.log('Proceeding to Checkout...');
    await evalCode(`
      (() => {
        const checkoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed to Checkout'));
        if (checkoutBtn) { checkoutBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture 3: Checkout & Billing
    await takeScreenshot('live-store-checkout-billing.png');

    // 5. Submit Checkout form to open QR Payment
    console.log('Submitting Checkout to generate QR...');
    await evalCode(`
      (() => {
        const payBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Proceed to UPI QR Payment'));
        if (payBtn) { payBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 2500));

    // Capture 4: QR Payment Modal
    await takeScreenshot('live-store-qr-payment.png');

    // 6. Simulate Payment Success in Sandbox
    console.log('Simulating Payment Success...');
    await evalCode(`
      (() => {
        const simBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Simulate Payment Success'));
        if (simBtn) { simBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 3000));

    // 7. Click Continue to Tracking (or auto-opened tracking)
    console.log('Navigating to Order Tracking...');
    await evalCode(`
      (() => {
        const trackBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continue to Tracking'));
        if (trackBtn) { trackBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 2000));

    // Capture 5: Order Tracking Modal
    await takeScreenshot('live-store-order-tracking.png');

    // 8. Open Invoice Preview
    console.log('Opening Tax Invoice...');
    await evalCode(`
      (() => {
        const invBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View / Print Invoice'));
        if (invBtn) { invBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture 6: GST Tax Invoice
    await takeScreenshot('live-store-invoice-print.png');

    // 9. Close invoice and open Farmer Dashboard
    console.log('Opening Farmer Dashboard...');
    await evalCode(`
      (() => {
        // Close modal
        const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => b.querySelector('svg'));
        if (closeBtns.length > 0) closeBtns[closeBtns.length - 1].click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1000));

    await evalCode(`
      (() => {
        const myOrdersBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('My Orders'));
        if (myOrdersBtn) { myOrdersBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture 7: Farmer Dashboard
    await takeScreenshot('live-store-farmer-dashboard.png');

    // 10. Close farmer dashboard and open Admin Operations Hub
    console.log('Opening Admin Operations Hub...');
    await evalCode(`
      (() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Close'));
        if (closeBtn) closeBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1000));

    await evalCode(`
      (() => {
        const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Operations Hub'));
        if (adminBtn) { adminBtn.click(); return true; }
        return false;
      })()
    `);
    await new Promise(r => setTimeout(r, 1500));

    // Capture 8: Admin & Operations Hub
    await takeScreenshot('live-store-admin-dashboard.png');

    console.log('All 8 live screenshots successfully captured!');
    ws.close();
  } catch (err) {
    console.error('CDP capture error:', err);
  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
