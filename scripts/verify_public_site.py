#!/usr/bin/env python3
"""Verify NVS Pages source artifacts from the exact commit checked out by Actions.

Public Pages CDN deployment is separately verified by GitHub Pages action and
browser layout is verified by check_mobile_layout.cjs.
Do not fail this workflow because a concurrent deployment serves stale content.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    "index.html": [b"qr-season.svg", b"season.html?id=NVS-CF-BHD-20261019", b"community.html"],
    "season.html": [b"<video", b"20261018_ChiFarm_CayGiong_Web.mp4", "Hồ sơ mùa vụ thực tế".encode()],
    "lot.html": [b"season.html?id=NVS-CF-BHD-20261019"],
    "assets/qr-season.svg": [b"<svg", b"<path"],
    "community.html": [b"portal-open-link", b"hero-inner", b"viewport-fit=cover"],
    "assets/nvs-portal-config.js": [b"script.google.com/macros/s/", b"/exec"],
    "assets/nvs-portal-bootstrap.js": [b"portal-open-link", b"portal-unavailable"],
    "assets/videos/20261018_ChiFarm_CayGiong_Web.mp4": [b"ftyp"],
}
for path, required in FILES.items():
    target = ROOT / path
    if not target.is_file():
        raise RuntimeError(f"Missing required file: {path}")
    payload = target.read_bytes()
    if not all(marker in payload for marker in required):
        raise AssertionError(f"Missing required source marker: {path}")
    if path.endswith(".mp4") and len(payload) < 50_000:
        raise AssertionError("Video asset missing or unusually small")
    print(f"PASS {path}: {len(payload)} bytes")
print("PASS: NVS source assets, real-season diary and Google Apps Script entry point.")
