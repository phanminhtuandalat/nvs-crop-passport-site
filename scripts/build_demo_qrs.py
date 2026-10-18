#!/usr/bin/env python3
"""Generate scan-ready SVG QR codes for explicit DEMO orders (not issued product codes)."""
import json
from pathlib import Path
from urllib.parse import quote
import qrcode
from qrcode.image.svg import SvgPathImage

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/demo_orders.json"
BASE = "https://phanminhtuandalat.github.io/nvs-crop-passport-site/"
OUT = ROOT / "assets"

def build() -> None:
    orders = json.loads(DATA.read_text(encoding="utf-8"))["orders"]
    assert len(orders) == 3
    assert len({o["token"] for o in orders}) == len(orders)
    for order in orders:
        assert order["status"] == "simulation_only", "Never issue commercial QR from demo build"
        assert order["qr_file"].startswith("./assets/qr-demo-")
        assert order["qr_file"].endswith(".svg")
        assert all(ch.isalnum() or ch in "-_" for ch in order["token"])
        url = BASE + "demo-order.html?token=" + quote(order["token"], safe="")
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(image_factory=SvgPathImage)
        dest = ROOT / order["qr_file"].removeprefix("./")
        assert dest.parent.resolve() == OUT.resolve()
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(str(dest))
        print(f"Built {dest.relative_to(ROOT)} for {order['buyer_display_name']}: {url}")

if __name__ == "__main__":
    build()
