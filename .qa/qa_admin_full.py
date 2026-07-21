"""QA: full admin login flow with correct password."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3100"
FAIL = False

def log(ok, label, detail=""):
    global FAIL
    icon = "PASS" if ok else "FAIL"
    if not ok:
        FAIL = True
    print(f"  [{icon}] {label}" + (f"  -- {detail}" if detail else ""))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    print("=== Step 1: Visit /admin/login ===")
    page.goto(f"{BASE}/admin/login", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1000)

    pw_input = page.locator("input[type='password']")
    submit = page.locator("button[type='submit']")
    log(pw_input.count() >= 1 and submit.count() >= 1,
        f"login form visible (pw={pw_input.count()} submit={submit.count()})")

    print("\n=== Step 2: Submit password 'sunstore' ===")
    pw_input.first.fill("sunstore")
    submit.first.click()
    page.wait_for_timeout(2500)
    print(f"  url after login: {page.url}")
    log(page.url.rstrip("/").endswith("/admin"),
        "redirected to /admin dashboard",
        f"actual url: {page.url}")

    print("\n=== Step 3: Dashboard renders stats ===")
    page.wait_for_timeout(1500)
    # Look for nav links that prove admin shell loaded
    nav_links = page.locator("a[href='/admin/products'], a[href='/admin/orders']")
    log(nav_links.count() >= 2, f"admin sidebar nav visible ({nav_links.count()} links)")

    print("\n=== Step 4: Admin stats API works with cookie ===")
    response = page.evaluate("""async () => {
        const r = await fetch('/api/admin/stats');
        return { status: r.status, body: await r.text() };
    }""")
    status = response["status"]
    log(status == 200, f"admin stats API returns 200 (got {status})",
        response["body"][:150] if status != 200 else "ok")

    print("\n=== Step 5: Admin products API ===")
    response = page.evaluate("""async () => {
        const r = await fetch('/api/admin/products');
        return { status: r.status, body: await r.text() };
    }""")
    status = response["status"]
    log(status == 200, f"admin products API returns 200 (got {status})",
        response["body"][:150] if status != 200 else "ok")

    print("\n=== Step 6: Visit /admin/products ===")
    page.goto(f"{BASE}/admin/products", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    log("/admin/products" in page.url, f"products page accessible (url={page.url})")

    print("\n=== Console errors ===")
    filtered = [e for e in console_errors if "favicon" not in e.lower()]
    log(len(filtered) == 0, "no console errors", f"{len(filtered)} errors" if filtered else "")
    for e in filtered[:5]:
        print(f"    - {e[:200]}")

    page.screenshot(path="c:/Users/admin/Documents/trae_projects/Sunset-Tengiz/.qa/admin_dashboard.png", full_page=True)
    print("\n  screenshot: .qa/admin_dashboard.png")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
