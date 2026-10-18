#!/usr/bin/env python3
"""Check NVS real-season QR destination and seedling video from the PUBLIC website."""
import sys
import time
from urllib.request import Request, urlopen

BASE = "https://phanminhtuandalat.github.io/nvs-crop-passport-site/"
PAGES = {
    "season.html?id=NVS-CF-BHD-20261019": [b"<video", b"20261018_ChiFarm_CayGiong_Web.mp4", "Hồ sơ mùa vụ thực tế".encode()],
    "lot.html?id=DEMO-NVS-0001": [b"season.html?id=NVS-CF-BHD-20261019"],
    "index.html": [b"qr-season.svg", b"season.html?id=NVS-CF-BHD-20261019"],
    "assets/qr-season.svg": [b"<svg", b"<path"],
    "assets/videos/20261018_ChiFarm_CayGiong_Web.mp4": [b"ftyp"],
    "demo-orders.html": [b"order-grid", b"demo-orders.js", b"CT Farm"],
    "demo-order.html": [b"verify-result", b"demo-orders.js"],
    "data/demo_orders.json": [b"DEMO-NVS-CTF-001", b"DEMO-NVS-LIM-002", b"DEMO-NVS-CEM-003", b"simulation_only"],
    "assets/demo-orders.js": ["CẢNH BÁO NGUỒN HÀNG".encode(), b"demo_orders.json"],
    "assets/demo-orders.css": [b"verify-flag", b"order-grid"],
    "assets/qr-demo-ctfarm.svg": [b"<svg", b"id=\"qr-path\""],
    "assets/qr-demo-lim.svg": [b"<svg", b"id=\"qr-path\""],
    "assets/qr-demo-cem.svg": [b"<svg", b"id=\"qr-path\""],
    "community.html": [b'id="invite-panel"', b'id="portal" hidden', b"assets/community.js"],
    "assets/community.js": [b"nvs-customer-portal", b"request_order", b"sessionStorage"],
    "assets/community.css": [b"invite-panel", b"season-card"],
}

def read(url):
    req = Request(url, headers={"User-Agent": "NVS-Crop-Passport-Smoke/1.0", "Cache-Control": "no-cache"})
    with urlopen(req, timeout=20) as r:
        data = r.read()
        if r.status != 200:
            raise RuntimeError(f"HTTP {r.status}: {url}")
        return data

for attempt in range(1, 16):
    try:
        for route, needles in PAGES.items():
            payload = read(BASE + route)
            if not all(v in payload for v in needles):
                raise AssertionError(f"Missing required site marker: {route}")
            if route.endswith(".mp4") and len(payload) < 50_000:
                raise AssertionError("MP4 file missing or unusually small")
            print(f"PASS {route}: {len(payload)} bytes")
        # Verify the connected staging backend is alive and denies uninvited users.
        import json
        from urllib.error import HTTPError
        api = "https://hkuoxyvwovuvphggdlkn.supabase.co/functions/v1/nvs-customer-portal"
        def post_action(payload):
            request = Request(api,
                data=json.dumps(payload).encode(),
                headers={
                    "Content-Type": "application/json",
                    "Origin": "https://phanminhtuandalat.github.io",
                    "User-Agent": "NVS-Portal-Smoke/1.0"
                },
                method="POST")
            try:
                with urlopen(request, timeout=22) as r:
                    return r.status, json.loads(r.read())
            except HTTPError as e:
                return e.code, json.loads(e.read())
        ping_code, ping_json = post_action({"action":"ping"})
        assert ping_code == 200 and ping_json.get("login_required") is True, (ping_code, ping_json)
        deny_code, deny_json = post_action({"action":"catalog"})
        assert deny_code == 401 and "Phiên truy cập" in deny_json.get("error",""), (deny_code, deny_json)
        wrong_code, wrong_json = post_action({"action":"redeem","phone":"+84000000000","code":"NVS-INVALID-TEST-CODE"})
        assert wrong_code == 401, (wrong_code, wrong_json)
        print("PASS invited backend: ping 200 / unauthorised catalog 401 / nonexistent invitation 401")
        print("PASS: real season + all 3 demo buyer QR pages and media verified over public HTTP")
        sys.exit(0)
    except Exception as exc:
        print(f"attempt {attempt} failed: {exc}", flush=True)
        if attempt == 15:
            raise
        time.sleep(10)
