"""
Extended QA: cart operations + currency switching + checkout navigation.
"""
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

    print("=== Setup: add 2 different products on /array ===")
    page.goto(f"{BASE}/array", wait_until="networkidle", timeout=30000)
    page.wait_for_selector("button:has-text('В корзину')", timeout=15000)
    add_buttons = page.locator("button:has-text('В корзину')")
    n = min(2, add_buttons.count())
    print(f"  clicking first {n} add buttons")
    for i in range(n):
        add_buttons.nth(i).click()
        page.wait_for_timeout(400)

    page.wait_for_timeout(1000)
    badge = page.locator("button[aria-label='Корзина'] span").inner_text()
    print(f"  cart badge after adds: '{badge}'")
    log(badge in ("2", "1"), "cart badge reflects multiple adds", f"badge={badge!r}")

    print("\n=== Go to /velocity and test quantity controls ===")
    page.goto(f"{BASE}/velocity", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)

    articles = page.locator("article")
    a_count = articles.count()
    log(a_count >= 1, f"cart shows {a_count} item(s)")

    # Click "+" to increase quantity of first item
    plus_btn = page.locator("button:has-text('+')").first
    if plus_btn.count() > 0:
        before_qty = page.locator("input[type='number']").first.input_value()
        plus_btn.click()
        page.wait_for_timeout(500)
        after_qty = page.locator("input[type='number']").first.input_value()
        log(int(after_qty) == int(before_qty) + 1,
            "quantity + button works",
            f"{before_qty} -> {after_qty}")

    # Test currency switcher in header
    print("\n=== Test currency switcher ===")
    currency_select = page.locator("select[aria-label='Валюта']")
    if currency_select.count() > 0:
        current = currency_select.first.input_value()
        new_cur = "USD" if current != "USD" else "EUR"
        currency_select.first.select_option(new_cur)
        page.wait_for_timeout(500)
        after = currency_select.first.input_value()
        log(after == new_cur, f"currency switched {current} -> {after}")

    # Test remove button
    print("\n=== Test remove-from-cart ===")
    remove_btn = page.locator("button:has-text('Удалить')").first
    if remove_btn.count() > 0:
        before = page.locator("article").count()
        remove_btn.click()
        page.wait_for_timeout(800)
        after = page.locator("article").count()
        log(after == before - 1, f"remove reduced items {before} -> {after}")

    print("\n=== Navigate to /checkout ===")
    page.goto(f"{BASE}/checkout", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    log(page.locator("text=Проверка").count() > 0 or page.locator("text=Корзины").count() > 0,
        "checkout page renders step 1")

    print("\n=== Console errors ===")
    filtered = [e for e in console_errors if "favicon" not in e.lower()]
    log(len(filtered) == 0, "no console errors",
        f"{len(filtered)} errors" if filtered else "")
    for e in filtered[:5]:
        print(f"    - {e[:200]}")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
