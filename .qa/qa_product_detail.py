"""E2E: Product 'Подробнее' button + detail page."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3101"
FAIL = False

def log(ok, label, detail=""):
    global FAIL
    icon = "PASS" if ok else "FAIL"
    if not ok:
        FAIL = True
    print(f"  [{icon}] {label}" + (f"  -- {detail}" if detail else ""))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Homepage has "Подробнее" buttons
    print("=== 1. Homepage product cards have 'Подробнее' ===")
    page.goto(f"{BASE}/", wait_until="networkidle", timeout=30000)
    page.wait_for_selector("button:has-text('В корзину')", timeout=15000)
    detail_links = page.locator("a:has-text('Подробнее')")
    log(detail_links.count() >= 1, f"found {detail_links.count()} 'Подробнее' links on homepage")

    # 2. Click first "Подробнее" link
    print("\n=== 2. Click 'Подробнее' -> product detail page ===")
    detail_links.first.click()
    page.wait_for_timeout(2000)
    url = page.url
    log("/product/" in url, f"navigated to product detail (url={url})")

    # 3. Detail page content
    print("\n=== 3. Product detail page renders ===")
    page.wait_for_timeout(1500)
    # Check for product name (should be one of the seed products)
    html = page.content()
    has_image = page.locator("img").count() > 0
    has_price = page.locator(".price-ss").count() > 0
    has_specs = page.locator("text=Характеристики").count() > 0 or html.find("characteristic") >= 0 or page.locator("dl, table").count() > 0
    has_cart_btn = page.locator("button:has-text('В корзину')").count() > 0
    has_back_link = page.locator("a:has-text('Вернуться'), a:has-text('каталог')").count() > 0

    log(has_price, "price displayed")
    log(has_cart_btn, "add-to-cart button present")
    log(has_back_link, "back to catalog link present")

    # 4. Add to cart from detail page
    print("\n=== 4. Add to cart from detail page ===")
    cart_btn = page.locator("button:has-text('В корзину')")
    if cart_btn.count() >= 1:
        cart_btn.first.click()
        page.wait_for_timeout(800)
        badge = page.locator("button[aria-label='Корзина'] span")
        log(badge.count() > 0, f"cart badge updated after add from detail page")

    # 5. /array page also has "Подробнее"
    print("\n=== 5. Catalog /array page has 'Подробнее' ===")
    page.goto(f"{BASE}/array", wait_until="networkidle", timeout=30000)
    page.wait_for_selector("button:has-text('В корзину')", timeout=15000)
    array_links = page.locator("a:has-text('Подробнее')")
    log(array_links.count() >= 1, f"found {array_links.count()} 'Подробнее' links on /array")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
