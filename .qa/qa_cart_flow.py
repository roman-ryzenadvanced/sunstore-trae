"""
End-to-end QA: reproduces the exact bug reported by the user.
Scenario: add product to cart > open cart > its empty.

Expected after fix: cart badge shows count, /velocity page shows the item.
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

    print("=== Step 1: Visit homepage ===")
    page.goto(f"{BASE}/", wait_until="networkidle", timeout=30000)
    log(True, "homepage loaded")

    print("\n=== Step 2: Wait for products to load ===")
    try:
        page.wait_for_selector("button:has-text('В корзину')", timeout=15000)
        add_buttons = page.locator("button:has-text('В корзину')")
        count = add_buttons.count()
        log(count > 0, f"found {count} add-to-cart buttons on homepage")
    except Exception as e:
        log(False, "no add-to-cart buttons found", str(e))
        browser.close()
        sys.exit(1)

    print("\n=== Step 3: Click first 'В корзину' button ===")
    add_buttons.nth(0).click()
    page.wait_for_timeout(1000)

    badge = page.locator("button[aria-label='Корзина'] span")
    badge_count = badge.count()
    badge_text = badge.inner_text() if badge_count else "(none)"
    print(f"  cart badge text: '{badge_text}'")
    log(badge_count > 0 and badge_text.strip() != "",
        "cart badge shows count after add",
        f"badge={badge_text!r}")

    print("\n=== Step 4: Navigate to /velocity (cart page) ===")
    page.goto(f"{BASE}/velocity", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)

    html = page.content()
    # Look for either empty-cart message OR product name evidence
    has_empty = "Ваша корзина пуста" in html
    # Cart items have <article> with product title - check for any article element
    article_count = page.locator("article").count()
    print(f"  page contains empty-cart message: {has_empty}")
    print(f"  page contains {article_count} <article> elements (cart line items)")

    log(article_count > 0 and not has_empty,
        "cart page shows the added product",
        "BUG STILL PRESENT (empty cart)" if has_empty else "cart persisted correctly")

    print("\n=== Step 5: Check console errors ===")
    filtered = [e for e in console_errors if "favicon" not in e.lower()]
    log(len(filtered) == 0, "no console errors during flow",
        f"{len(filtered)} errors" if filtered else "")
    for e in filtered[:5]:
        print(f"    - {e[:200]}")

    page.screenshot(path="c:/Users/admin/Documents/trae_projects/Sunset-Tengiz/.qa/qa_cart_velocity.png", full_page=True)
    print("\n  screenshot: .qa/qa_cart_velocity.png")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
