---
name: invoice-generator
description: Generate professional, single-page PDF invoices for freelance / contractor / ambassador services. Use this skill whenever the user asks to "generate invoices", "make a PDF invoice", "create monthly invoices", "bill a client", "OCR an invoice and remake it", "redo this invoice screenshot as a clean PDF", "send invoices for this month", or references invoice numbers like INV-XXX with dollar amounts — even if they don't explicitly say "skill" or "template". Also triggers for batch generation of multiple invoices at once, and for editing an existing invoice template (changing amounts, dates, contact info, footer text, VAT status). Produces vector PDFs with embedded fonts, navy/bronze professional styling, payment instructions block, and optional "VAT WAIVED INVOICE" footer.
---

# Invoice Generator

A reusable PDF invoice generator for monthly contractor / ambassador / freelance billing. One JSON input → one or more professional single-page PDF invoices, every time.

## When to use

Trigger this skill whenever the user wants to:

- Generate **one or more PDF invoices** (batch supported)
- Convert a screenshot / scan of an invoice into a clean remake
- Edit an existing invoice (change amount, date, phone, footer, VAT status)
- Set up a **monthly recurring invoice workflow** ("generate July's invoices", "next month's invoices")
- Produce invoices with a consistent brand look (navy + bronze, TBC Bank payment details)

Even if the user just says "make me an invoice for $1500" or "send this month's bills", use this skill.

## How it works

The skill is driven by **one Python script**: `scripts/invoice_generator.py`. It accepts either:

1. **A JSON file** describing the defaults + invoice list (preferred for monthly batches)
2. **A `--prompt` string** like `"INV-CN-004 $1150, INV-CN-005 $200"` (quick one-offs)

It writes one PDF per invoice to `/home/z/my-project/download/`.

## Quick start — monthly workflow

This is the canonical monthly workflow. Walk the user through these steps:

### 1. Copy the template

```bash
cp skills/invoice-generator/examples/template.json /home/z/my-project/scripts/this_month.json
```

### 2. Edit `this_month.json`

Update three things:

- `defaults.invoice_date` — e.g. `"31 July 2026"`
- `defaults.service_date` — e.g. `"31-07-2026"`
- `defaults.service_description` — e.g. `"Community Ambassador Services - July 2026"`
- `invoices` array — invoice numbers + amounts for this month

Each invoice entry only needs `invoice_number` and `amount`. Everything else inherits from `defaults`. To override per-invoice (e.g. different service description), add fields to that invoice's object — see `examples/july_2026_with_overrides.json`.

### 3. Generate

```bash
python skills/invoice-generator/scripts/invoice_generator.py /home/z/my-project/scripts/this_month.json
```

Output appears in `/home/z/my-project/download/INV-CN-XXX.pdf`.

### 4. Verify

Open the PDFs and confirm:

- Invoice numbers and amounts match what was entered
- Dates are correct
- Phone / bank details are current
- Footer says "VAT WAIVED INVOICE" (or whatever `footer_note` was set to)

## Quick start — one-off invoice

For a single quick invoice without editing JSON:

```bash
python skills/invoice-generator/scripts/invoice_generator.py --prompt "INV-CN-009 $1850"
```

Multiple at once:

```bash
python skills/invoice-generator/scripts/invoice_generator.py --prompt "INV-CN-009 $1850, INV-CN-010 $300, INV-CN-011 $250"
```

This uses built-in defaults (Roman → JINGSHENG, TBC Bank, today's date, VAT WAIVED). Override anything by switching to JSON mode.

## Input JSON schema

```jsonc
{
  "defaults": {
    "seller": {
      "name": "Roman Markuze",
      "address": "Bezhan Kalandadze 3, Batumi, Georgia",
      "contact": "+995 597 98 12 15"
    },
    "buyer": {
      "company_name": "JINGSHENG HENGXING TECHNOLOGY PTE. LTD.",
      "country": "Singapore"
    },
    "invoice_date":   "31 July 2026",
    "service_date":   "31-07-2026",
    "service_description": "Community Ambassador Services",
    "currency":       "USD",
    "vat_status":     "WAIVED",                  // "WAIVED" | "TAXABLE:18" | "TAXABLE:0"
    "footer_note":    "VAT WAIVED INVOICE",      // null/empty hides the footer band
    "payment_info": [
      ["Account Name",          "P/E ROMAN MARKUZE"],
      ["Account Number (IBAN)", "GE62TB7611636615100028"],
      // ... full bank details
    ],
    "notes": "Payment due within 7 days... {inv_no} ... {currency} ..."
  },
  "invoices": [
    { "invoice_number": "INV-CN-004", "amount": 1150.00 },
    { "invoice_number": "INV-CN-005", "amount": 200.00,
      "service_description": "Community Ambassador Services - July 2026 (Tier B)"  // optional override
    }
  ]
}
```

### Field reference

| Field | Where | Purpose |
|---|---|---|
| `seller.name` / `seller.address` / `seller.contact` | defaults | Shown in BILL FROM block + notes |
| `buyer.company_name` / `buyer.country` | defaults | Shown in BILL TO block |
| `invoice_date` | defaults | Human-readable date string at top right |
| `service_date` | defaults | Date(s) of service rendered, shown in charges table |
| `service_description` | defaults | Used in subtitle, charges row, and bill-to block |
| `currency` | defaults | 3-letter code, shown in all money amounts |
| `vat_status` | defaults | `"WAIVED"` → tax=0 + footer note. `"TAXABLE:18"` → 18% VAT line added. |
| `footer_note` | defaults | Bold accent text in footer (e.g. "VAT WAIVED INVOICE"). `null` to hide. |
| `payment_info` | defaults | List of `[label, value]` pairs rendered in payment block. IBAN/SWIFT auto-use mono font. |
| `notes` | defaults | Template string. `{inv_no}` and `{currency}` are auto-substituted per invoice. |
| `invoice_number` | each invoice | Required. Used as filename and shown at top right. |
| `amount` | each invoice | Required. Numeric, e.g. `1150.00`. Subtotal/total auto-calculated. |
| any other field | each invoice | Optional override of the same-named default. |

### Override semantics

- **Top-level scalars** (`invoice_date`, `currency`, `vat_status`, etc.) — per-invoice value replaces default.
- **`seller` / `buyer`** — per-invoice dict is **merged** into default dict (so you can override just `seller.contact` while keeping the rest).
- **`payment_info`** — per-invoice list **fully replaces** default list (no merge — payment details are an atomic block).

## Common edits

### Change seller phone number

Edit `defaults.seller.contact` AND the matching row in `defaults.payment_info` (the `("Telephone Number", ...)` entry). Both places must match — the BILL FROM block uses `seller.contact`, the payment block uses `payment_info`.

### Add VAT / tax

Set `defaults.vat_status` to `"TAXABLE:18"` (or whatever rate). The script will:

- Add a `Tax (18% VAT)` line in the totals section showing the calculated tax
- Update the `TOTAL DUE` to include tax
- The `footer_note` stays whatever you set (you may want to change it from "VAT WAIVED INVOICE" to something else or `null`)

### Change buyer

For a one-off different client, add a `buyer` override on that specific invoice:

```json
{
  "invoice_number": "INV-CN-009",
  "amount": 2000.00,
  "buyer": {
    "company_name": "ACME CORP LLC",
    "country": "United States"
  }
}
```

For a permanent change, edit `defaults.buyer`.

### Change bank account

Replace the entire `defaults.payment_info` list. Format is `[["Label", "Value"], ...]`. Labels containing "IBAN", "SWIFT", or "ACCOUNT NUMBER" automatically render in monospace font for readability.

## Visual design (locked)

The template uses a fixed navy + bronze palette for a professional, consistent look across all months. Do not change this unless the user explicitly asks for a redesign.

- **Palette**: deep navy `#2c3e50` for headers/totals band, bronze `#8c7225` for accents, warm off-white `#f7f6f4` for cards.
- **Fonts**: Liberation Sans (body/headings), Liberation Mono (IBAN/SWIFT/account numbers).
- **Layout**: single A4 page, 20mm margins, top accent band, footer with "VAT WAIVED INVOICE" badge.

If you need a different look (logo, different palette, multi-page), that's a separate task — do not modify this skill. Build a new variant instead.

## Output location

All PDFs are saved to `/home/z/my-project/download/`. Filename = `{invoice_number}.pdf` (e.g. `INV-CN-004.pdf`). Existing files are overwritten — be careful not to lose prior months' PDFs if you reuse invoice numbers.

## Validation

After generation, you can verify quality with:

```bash
python3 /home/z/my-project/skills/pdf/scripts/pdf_qa.py /home/z/my-project/download/INV-CN-004.pdf
```

This checks: fonts embedded, no content overflow, symmetric margins, single-page, metadata set.

## Examples bundled

| File | Use case |
|---|---|
| `examples/template.json` | Blank monthly template — copy & edit |
| `examples/june_2026_invoices.json` | Reproduces today's invoices ($1150 / $150 / $200) |
| `examples/july_2026_with_overrides.json` | Shows per-invoice override of `service_description` and `service_date` |

## Troubleshooting

**"Could not parse any invoice entries from prompt"** — the `--prompt` parser expects patterns like `INV-XXX $amount`. Check the format. Spaces, commas, semicolons, equals signs, and colons are all OK as separators.

**Two-page output instead of one** — the template is tuned to fit one A4 page. If you add very long service descriptions or many payment_info rows, it may overflow. Keep `service_description` under ~60 chars and `payment_info` under 10 rows.

**Phone number shows in two places** — that's intentional (BILL FROM block + payment instructions). Update both `seller.contact` and the `("Telephone Number", ...)` row in `payment_info` to keep them in sync.

**Wrong date** — the script does NOT auto-compute dates from the invoice number. You must set `invoice_date` and `service_date` explicitly in the JSON. The `--prompt` mode defaults to today's date.
