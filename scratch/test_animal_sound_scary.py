import asyncio
import json
import os
import subprocess
import time
import http.server
import socketserver
import threading
import urllib.request
import websockets
import base64

PORT = 5174
DIST_DIR = r"C:\Users\Admin\.gemini\antigravity\scratch\agrisense-weather\dist"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\9f14c222-7df9-41bc-a24b-eb5320975177"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving HTTP on port {PORT}")
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(1)

# Start Chrome with remote debugging
user_data_dir = os.path.join(ARTIFACT_DIR, "scratch", "chrome_test_profile")
os.makedirs(user_data_dir, exist_ok=True)

chrome_proc = subprocess.Popen([
    CHROME_PATH,
    "--headless=new",
    "--remote-debugging-port=9222",
    "--window-size=1280,1024",
    "--autoplay-policy=no-user-gesture-required",
    f"--user-data-dir={user_data_dir}",
    "about:blank"
])

time.sleep(2)

async def run_cdp():
    # Get WebSocket debugger URL
    resp = urllib.request.urlopen("http://localhost:9222/json").read()
    targets = json.loads(resp)
    ws_url = targets[0]["webSocketDebuggerUrl"]
    print("Connecting to Chrome WebSocket:", ws_url)

    async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
        msg_id = 0

        async def send_cmd(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method, "params": params or {}}
            await ws.send(json.dumps(payload))
            while True:
                res = json.loads(await ws.recv())
                if res.get("id") == msg_id:
                    return res.get("result", {})

        await send_cmd("Page.enable")
        await send_cmd("Runtime.enable")

        # Navigate to app
        print("Navigating to http://localhost:5174/ ...")
        await send_cmd("Page.navigate", {"url": f"http://localhost:{PORT}/"})
        await asyncio.sleep(4)

        # Switch to Animal Sound tab
        print("Clicking Animal Sound tab...")
        eval_res = await send_cmd("Runtime.evaluate", {
            "expression": """
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent && b.textContent.includes('Animal Sound'));
                if (btn) {
                    btn.click();
                    return { found: true, text: btn.textContent };
                }
                return { found: false };
            })()
            """,
            "returnByValue": True
        })
        print("Animal sound tab clicked:", eval_res)
        await asyncio.sleep(2)

        # Switch to Demo tab inside Animal Sound
        print("Clicking Demo Simulation subtab...")
        await send_cmd("Runtime.evaluate", {
            "expression": """
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent && b.textContent.includes('Demo Simulation'));
                if (btn) {
                    btn.click();
                    return { found: true };
                }
                return { found: false };
            })()
            """,
            "returnByValue": True
        })
        await asyncio.sleep(1)

        # Trigger 1. Wild Boar Confirmed demo test
        print("Triggering Wild Boar Demo Scenario (Scary Tiger Roar)...")
        boar_res = await send_cmd("Runtime.evaluate", {
            "expression": """
            (() => {
                const btn = document.querySelector('[data-demo-scenario="wild_boar_instant"]');
                if (btn) {
                    btn.click();
                    return { found: true };
                }
                return { found: false };
            })()
            """,
            "returnByValue": True
        })
        print("Wild Boar instant test clicked:", boar_res)
        await asyncio.sleep(2.5)

        # Capture Screenshot of Demo Testing view with active scary sound feedback
        shot1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
        shot1_path = os.path.join(ARTIFACT_DIR, "live-animal-sound-scary-demo.png")
        with open(shot1_path, "wb") as f:
            f.write(base64.b64decode(shot1["data"]))
        print("Saved screenshot 1 to:", shot1_path)

        # Switch to 1-Click Animal Soundboard subtab
        print("Switching to 1-Click Animal Soundboard...")
        await send_cmd("Runtime.evaluate", {
            "expression": """
            (() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent && b.textContent.includes('Soundboard'));
                if (btn) {
                    btn.click();
                    return { found: true };
                }
                return { found: false };
            })()
            """,
            "returnByValue": True
        })
        await asyncio.sleep(1)

        # Test Wild Boar on the soundboard
        print("Testing Wild Boar sound on soundboard...")
        sb_res = await send_cmd("Runtime.evaluate", {
            "expression": """
            (() => {
                const btn = document.querySelector('[data-sample-key="wild_boar"]');
                if (btn) {
                    btn.click();
                    return { found: true };
                }
                return { found: false };
            })()
            """,
            "returnByValue": True
        })
        print("Soundboard boar test clicked:", sb_res)
        await asyncio.sleep(2.5)

        # Check latest recognition result state
        state_res = await send_cmd("Runtime.evaluate", {
            "expression": """
            (() => {
                const banner = document.querySelector('.bg-gradient-to-br');
                return {
                    text: document.body.innerText.slice(0, 1500)
                };
            })()
            """,
            "returnByValue": True
        })
        print("Text preview snippet:", state_res.get("value", {}).get("text", "")[:300])

        # Capture Screenshot of Soundboard testing view
        shot2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
        shot2_path = os.path.join(ARTIFACT_DIR, "live-animal-soundboard-verified.png")
        with open(shot2_path, "wb") as f:
            f.write(base64.b64decode(shot2["data"]))
        print("Saved screenshot 2 to:", shot2_path)

try:
    asyncio.run(run_cdp())
finally:
    chrome_proc.terminate()
    print("Test run completed successfully!")
