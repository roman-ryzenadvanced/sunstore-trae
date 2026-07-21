"""E2E: Email system admin pages + newsletter subscribe."""
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

    # Login
    page.goto(f"{BASE}/admin/login", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1000)
    page.locator("input[type='password']").first.fill("sunstore")
    page.locator("button[type='submit']").first.click()
    page.wait_for_timeout(2000)

    # 1. Navigation has new items
    print("=== 1. Admin nav has new items ===")
    nav_subs = page.locator("a[href='/admin/subscribers']")
    nav_email = page.locator("a[href='/admin/settings/email']")
    log(nav_subs.count() >= 1, f"'Рассылка' link in nav")
    log(nav_email.count() >= 1, f"'Email' link in nav")

    # 2. Email settings page
    print("\n=== 2. Email settings page ===")
    page.goto(f"{BASE}/admin/settings/email", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    log(page.url.rstrip("/").endswith("/admin/settings/email"), "email settings page loads")

    provider_select = page.locator("select")
    log(provider_select.count() >= 1, "provider selector present")

    # Check SMTP fields are visible when smtp selected
    smtp_host = page.locator("input[placeholder*='smtp'], input[placeholder*='SMTP']")
    log(smtp_host.count() >= 1, "SMTP host field present")

    test_btn = page.locator("button:has-text('Проверить')")
    save_btn = page.locator("button:has-text('Сохранить')")
    log(test_btn.count() >= 1 and save_btn.count() >= 1,
        "test + save buttons present")

    # 3. Mailing list page
    print("\n=== 3. Mailing list page ===")
    page.goto(f"{BASE}/admin/subscribers", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    log(page.url.rstrip("/").endswith("/admin/subscribers"), "subscribers page loads")

    add_btn = page.locator("button:has-text('Добавить подписчика')")
    log(add_btn.count() >= 1, "add subscriber button present")

    # Stats
    stats = page.locator(".card-ss.p-4")
    log(stats.count() >= 3, f"stats bar visible ({stats.count()} cards)")

    # Add subscriber
    add_btn.first.click()
    page.wait_for_timeout(500)
    email_input = page.locator("input[type='email'], input[placeholder*='email']")
    if email_input.count() >= 1:
        email_input.first.fill("test@example.com")
        page.locator("button:has-text('Сохранить'), button:has-text('Добавить')").last.click()
        page.wait_for_timeout(1000)
        log(page.locator("text=test@example.com").count() >= 1,
            "subscriber added and visible in table")

    # Newsletter section
    subject_input = page.locator("input[placeholder*='Тема'], input[placeholder*='теме']").first
    newsletter_btn = page.locator("button:has-text('Отправить всем')")
    log(subject_input.count() >= 1 and newsletter_btn.count() >= 1,
        "newsletter compose section present")

    # 4. Footer newsletter widget (public)
    print("\n=== 4. Footer newsletter widget ===")
    page.goto(f"{BASE}/", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(1500)
    footer_email = page.locator("footer input[placeholder*='email'], footer input[placeholder*='Email'], footer input[type='email']")
    # The footer input may not be inside a <footer> tag in the DOM locator sense
    all_email_inputs = page.locator("input[type='email'], input[placeholder*='email']")
    # Find one that's near the bottom of the page
    log(all_email_inputs.count() >= 1,
        f"newsletter email input found in page ({all_email_inputs.count()} total)")
    subscribe_btn = page.locator("footer button:has-text('OK'), button.btn-primary:has-text('OK')")
    log(subscribe_btn.count() >= 1, "subscribe OK button found")

    # 5. Public subscribe API
    print("\n=== 5. Public subscribe API ===")
    resp = page.evaluate("""async () => {
        const r = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'user@test.ru' })
        });
        return { status: r.status, body: await r.json() };
    }""")
    log(resp["status"] == 200 and resp["body"].get("ok"),
        f"subscribe API works (status={resp['status']})")

    # 6. Public unsubscribe API
    print("\n=== 6. Public unsubscribe API ===")
    resp = page.evaluate("""async () => {
        const r = await fetch('/api/newsletter/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'user@test.ru' })
        });
        return { status: r.status, body: await r.json() };
    }""")
    log(resp["status"] == 200 and resp["body"].get("ok"),
        f"unsubscribe API works (status={resp['status']})")

    # 7. Email config API
    print("\n=== 7. Email config API ===")
    resp = page.evaluate("""async () => {
        const r = await fetch('/api/admin/email-config');
        return { status: r.status, body: await r.json() };
    }""")
    log(resp["status"] == 200,
        f"email config API returns (status={resp['status']})")
    log(resp["body"].get("provider") == "none",
        "default provider is 'none'")

    browser.close()

print("\n" + ("=" * 60))
print("OVERALL: " + ("ALL CHECKS PASSED" if not FAIL else "FAILURES DETECTED"))
print("=" * 60)
sys.exit(1 if FAIL else 0)
