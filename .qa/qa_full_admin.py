"""
E2E QA: Full admin products management flow.
Tests: categories CRUD, products with rich editor, image upload.
"""
import sys, base64, io
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3101"
FAIL = False

def log(ok, label, detail=""):
    global FAIL
    icon = "PASS" if ok else "FAIL"
    if not ok:
        FAIL = True
    print(f"  [{icon}] {label}" + (f"  -- {detail}" if detail else ""))

def login_admin(page):
    """Login to admin and return to dashboard."""
    page.goto(f"{BASE}/admin/login", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1000)
    pw = page.locator("input[type='password']")
    if pw.count() >= 1:
        pw.first.fill("sunstore")
        page.locator("button[type='submit']").first.click()
        page.wait_for_timeout(2000)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

    login_admin(page)

    # ====== CATEGORIES ======
    print("=== 1. Categories page loads ===")
    page.goto(f"{BASE}/admin/categories", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    log(page.url.rstrip("/").endswith("/admin/categories"),
        "categories page accessible")

    # Check category table has seed data
    rows = page.locator("table tbody tr")
    log(rows.count() >= 6, f"categories table has {rows.count()} seed rows")

    # Check nav link exists
    cat_link = page.locator("a[href='/admin/categories']")
    log(cat_link.count() >= 1, "Категории nav link visible in sidebar")

    # Add a new category via API
    print("\n=== 2. Create category via API ===")
    resp = page.evaluate("""async () => {
        const r = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Аксессуары', slug: 'accessories', description: 'Кабели, разъёмы, инструменты' })
        });
        return { status: r.status, body: await r.json() };
    }""")
    log(resp["status"] == 201, f"created category 'Аксессуары' (status={resp['status']})")

    # Verify it appears
    page.goto(f"{BASE}/admin/categories", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    has_accessories = page.locator("text=Аксессуары").count() > 0
    log(has_accessories, "new category appears in table")

    print("\n=== 3. Update category ===")
    resp = page.evaluate("""async () => {
        const r = await fetch('/api/admin/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'cat_7', name: 'Аксессуары и кабели' })
        });
        return { status: r.status };
    }""")
    log(resp["status"] == 200, f"updated category name (status={resp['status']})")

    # ====== PRODUCTS PAGE ======
    print("\n=== 4. Products page loads with category filter ===")
    page.goto(f"{BASE}/admin/products", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)

    # Check filter pills exist
    pills = page.locator("button").filter(has_text="Все")
    all_pills = page.locator(".badge-ss, .badge-accent")
    log(all_pills.count() >= 2, f"category filter pills visible ({all_pills.count()} pills)")

    # Check product table has data
    prod_rows = page.locator("table tbody tr")
    log(prod_rows.count() >= 6, f"products table has {prod_rows.count()} rows")

    # Check for "Добавить товар" button
    add_btn = page.locator("button:has-text('Добавить товар')")
    log(add_btn.count() >= 1, "add product button exists")

    # Filter by category
    print("\n=== 5. Category filter works ===")
    panels_pill = page.locator("button:has-text('Панели')")
    if panels_pill.count() >= 1:
        panels_pill.first.click()
        page.wait_for_timeout(500)
        filtered_rows = page.locator("table tbody tr")
        log(filtered_rows.count() >= 1, f"filtered to panels ({filtered_rows.count()} rows)")

        # Click "Все" to reset
        all_btn = page.locator("button:has-text('Все')")
        if all_btn.count() >= 1:
            all_btn.first.click()
            page.wait_for_timeout(500)
            all_rows = page.locator("table tbody tr")
            log(all_rows.count() > filtered_rows.count(),
                f"reset filter shows all ({all_rows.count()} rows)")

    # Open add product modal
    print("\n=== 6. Add product modal with rich editor ===")
    add_btn.first.click()
    page.wait_for_timeout(1000)
    modal = page.locator(".fixed.inset-0.z-40")
    log(modal.count() >= 1, "product modal opened")

    # Check rich editor is present (TipTap renders a ProseMirror div)
    editor_area = page.locator(".ProseMirror, .rich-editor-content, [contenteditable='true']")
    log(editor_area.count() >= 1, f"rich text editor present ({editor_area.count()} editors)")

    # Check image upload area
    upload_btn = page.locator("button:has-text('Загрузить')")
    log(upload_btn.count() >= 1, "upload image button present")

    # Check gallery picker button
    gallery_btn = page.locator("button:has-text('Выбрать из загруженных')")
    log(gallery_btn.count() >= 1, "gallery picker button present")

    # Check URL fallback input
    url_input = page.locator("input[placeholder*='URL']")
    log(url_input.count() >= 1, "URL fallback input present")

    # Fill in the form
    print("\n=== 7. Fill product form ===")
    name_input = page.locator("input").filter(has_text="").first
    # Find inputs by their labels
    name_field = page.locator("label:has-text('Название') + input, label:has-text('Название') ~ .input-ss input").first
    if name_field.count() == 0:
        name_field = page.locator("input").nth(0)

    # Type product name
    page.locator("input").nth(0).fill("Тестовый товар QA")
    page.wait_for_timeout(200)

    # Type in rich editor
    if editor_area.count() >= 1:
        editor_area.first.click()
        editor_area.first.fill("Описание для тестового товара")
        page.wait_for_timeout(300)

    # Set price
    price_inputs = page.locator("input[type='number']")
    if price_inputs.count() >= 1:
        price_inputs.first.fill("15990")

    # Submit
    print("\n=== 8. Save product ===")
    save_btn = page.locator("button:has-text('Сохранить')")
    if save_btn.count() >= 1:
        save_btn.first.click()
        page.wait_for_timeout(2000)
        # Modal should close
        modal_after = page.locator(".fixed.inset-0.z-40")
        log(modal_after.count() == 0, "modal closed after save")

        # Check new product in table
        has_qa = page.locator("text=Тестовый товар QA").count() > 0
        log(has_qa, "new product appears in table")

    print("\n=== 9. Image upload API ===")
    # Create a tiny 1x1 red PNG for upload test
    png_bytes = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )
    # Convert to data URL for upload
    data_url = f"data:image/png;base64,{base64.b64encode(png_bytes).decode()}"

    # Use the API directly
    resp = page.evaluate("""async (dataUrl) => {
        // Convert data URL to blob for FormData
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fd = new FormData();
        fd.append('file', blob, 'qa_test.png');

        const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        return { status: r.status, body: await r.json() };
    }""", data_url)
    log(resp["status"] == 200 and resp["body"].get("ok"),
        f"image upload API works (status={resp['status']})",
        resp["body"].get("url", "") if resp["body"].get("ok") else resp["body"])

    if resp["body"].get("ok"):
        uploaded_url = resp["body"]["url"]
        # Verify the image is accessible
        img_resp = page.evaluate("""async (url) => {
            const r = await fetch(url);
            return { status: r.status };
        }""", uploaded_url)
        log(img_resp["status"] == 200, f"uploaded image accessible at {uploaded_url}")

    print("\n=== 10. Upload list API ===")
    resp = page.evaluate("""async () => {
        const r = await fetch('/api/admin/upload/list');
        return { status: r.status, body: await r.json() };
    }""")
    log(resp["status"] == 200 and isinstance(resp["body"].get("files"), list),
        f"upload list returns files (status={resp['status']}, count={len(resp['body'].get('files', []))})")

    # ====== CLEANUP ======
    print("\n=== 11. Delete test product ===")
    # Find the test product row and delete it
    test_row = page.locator("tr").filter(has_text="Тестовый товар QA")
    if test_row.count() >= 1:
        del_btn = test_row.locator("button:has-text('Удалить')")
        if del_btn.count() >= 1:
            # Handle confirm dialog
            page.on("dialog", lambda dialog: dialog.accept())
            del_btn.first.click()
            page.wait_for_timeout(1000)
            gone = page.locator("text=Тестовый товар QA").count() == 0
            log(gone, "test product deleted")

    print("\n=== Console errors ===")
    filtered = [e for e in console_errors if "favicon" not in e.lower() and "404" not in e]
    log(len(filtered) == 0, "no console errors",
        f"{len(filtered)} errors" if filtered else "")
    for e in filtered[:5]:
        print(f"    - {e[:200]}")

    page.screenshot(path="c:/Users/admin/Documents/trae_projects/Sunset-Tengiz/.qa/admin_products_new.png", full_page=True)
    print("\n  screenshot: .qa/admin_products_new.png")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
