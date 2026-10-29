"""Screenshot every Dossier screen with Supabase mocked from the seed data (works offline).

Usage: bun run dev, then python3 scripts/screenshots/shoot.py <out_dir> [base_url]
Needs: pip install playwright && playwright install chromium
"""
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1])
BASE = sys.argv[2] if len(sys.argv) > 2 else "http://127.0.0.1:5173"
OUT.mkdir(parents=True, exist_ok=True)

import runpy

# Mock data and the Supabase route handler live next to this file.
_mock = runpy.run_path(str(Path(__file__).with_name("mockdata.py")))
handle = _mock["handle"]

SHOTS = [
    ("landing", "/", False),
    ("timeline", "/app", True),
    ("capture", "/capture", True),
    ("archive", "/profile", True),
    ("plus", "/dossier-plus", True),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, path, guest in SHOTS:
        for child in ([None] if not guest or name == "plus" else [None, "Lucy"]):
            ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
            if guest:
                ctx.add_init_script("localStorage.setItem('dossier-guest','1')")
            page = ctx.new_page()
            page.route(re.compile(r".*supabase\.co/.*"), handle)
            page.route(re.compile(r".*/_serverFn/.*"), lambda r: r.fulfill(status=500, body="offline"))
            page.goto(BASE + path, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(2600)
            if child:
                page.get_by_role("button", name=re.compile(child)).first.click()
                page.wait_for_timeout(900)
            suffix = f"-{child.lower()}" if child else ""
            page.screenshot(path=str(OUT / f"{name}{suffix}-view.png"))
            page.screenshot(path=str(OUT / f"{name}{suffix}.png"), full_page=True)
            ctx.close()
    browser.close()
print("done", sorted(x.name for x in OUT.iterdir()))
