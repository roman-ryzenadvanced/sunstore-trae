"""Quick focused QA: verify the 3 minor test failures were false positives."""
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
    context = browser.new_context()
    page = context.new_page()

    # Login
    page.goto(f"{BASE}/admin/login", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1000)
    page.locator("input[type='password']").first.fill("sunstore")
    page.locator("button[type='submit']").first.click()
    page.wait_for_timeout(2000)

    # 1. Create a category, then update it with the REAL returned id
    print("=== 1. Category update with correct ID ===")
    resp = page.evaluate("""async () => {
        const create = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Тест', slug: 'test-qa' })
        });
        const cat = await create.json();
        const id = cat.category.id;

        const update = await fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name: 'Тест обновлён' })
        });
        return { createStatus: create.status, updateStatus: update.status, id };
    }""")
    log(resp["updateStatus"] == 200,
        f"category update works with correct ID (status={resp['updateStatus']})")

    # 2. Category filter reset
    print("\n=== 2. Category filter reset ===")
    page.goto(f"{BASE}/admin/products", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)

    # Click a category filter
    panels = page.locator("button:has-text('Панели')")
    if panels.count() >= 1:
        panels.first.click()
        page.wait_for_timeout(600)
        filtered = page.locator("table tbody tr").count()
        print(f"  after filter: {filtered} rows")

        # Reset to all
        all_btn = page.locator("text=Все").first
        all_btn.click()
        page.wait_for_timeout(600)
        all_rows = page.locator("table tbody tr").count()
        print(f"  after reset: {all_rows} rows")
        log(all_rows > filtered,
            f"filter reset works ({filtered} -> {all_rows})")

    # 3. URL fallback input exists in modal
    print("\n=== 3. URL fallback input in modal ===")
    page.locator("button:has-text('Добавить товар')").first.click()
    page.wait_for_timeout(1000)
    url_label = page.locator("text=или введите URL")
    url_input = page.locator("input[placeholder*='example.com']")
    log(url_label.count() >= 1 and url_input.count() >= 1,
        "URL fallback section present (label + input)")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
