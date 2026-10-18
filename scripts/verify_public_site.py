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
    "community.html": [b"portal-open-link", b"nvs-portal-config.js", b"hero-inner", b"viewport-fit=cover"],
    "assets/nvs-portal-config.js": [b"AKfycbwigGFCxwRx7MWVQ7-ScAheTLI9ESVeJixoJDABGTOuAkTFYULChqdXt1sdSFNdYwwZSg/exec"],
    "assets/nvs-portal-bootstrap.js": [b"portal-open-link", b"script.google.com"],
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
        print("PASS: public QR passport, redirect, and seedling MP4 verified")
        sys.exit(0)
    except Exception as exc:
        print(f"attempt {attempt} failed: {exc}", flush=True)
        if attempt == 15:
            raise
        time.sleep(10)
