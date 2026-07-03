# Design Notes

This file documents the design decisions baked into the invoice template. Read it if you need to modify the visual layout or add new invoice variants.

## Why this layout

The template was built from a real-world use case: a freelance Community Ambassador billing a Singapore-based company monthly from Georgia. Key constraints that shaped the design:

1. **Single page** — invoices go to accounting departments that scan, not read. One page = fast review.
2. **Navy + bronze palette** — corporate-trustworthy without looking like a generic Word template. Bronze accent evokes premium/stability; navy signals finance/seriousness.
3. **Liberation Sans, not Helvetica** — Liberation Sans is metric-compatible with Helvetica but freely redistributable and embedded in PDFs cleanly. Avoids the "Arial/Helvetica not embedded" warning.
4. **Mono font for IBAN/SWIFT** — these strings are read character-by-character when typed into banking interfaces. Monospace makes them easier to transcribe correctly.
5. **"VAT WAIVED INVOICE" footer** — required for cross-border B2B services where the seller is not VAT-registered. The footer is a visual declaration that survives PDF → print → scan.
6. **No signature block** — the invoice explicitly states "computer-generated invoice and is valid without signature" because the seller is an individual contractor, not a company with a seal.

## Layout structure (top to bottom)

```
┌──────────────────────────────────────────────────┐
│ ▰▰▰ (bronze accent band, full width, 6mm)        │
│                                                  │
│  INVOICE                  INVOICE NO.  INV-CN-X  │
│  FOR ...                  DATE         ...       │
│                           AMOUNT DUE   $X USD    │
│  ────────────────────────────────────────────    │  ← navy thick + bronze thin divider
│  ┌─────────────────────┬─────────────────────┐  │
│  │ BILL FROM           │ BILL TO             │  │  ← warm card with bronze top border
│  │ Roman Markuze       │ JINGSHENG HENGXING  │  │
│  │ Batumi, Georgia     │ Singapore           │  │
│  │ CONTACT             │ SERVICES            │  │
│  │ +995 ...            │ Community Ambassador│  │
│  └─────────────────────┴─────────────────────┘  │
│                                                  │
│  CHARGES                                         │  ← bronze section heading
│  ┌──────────┬────────┬────┬──────────┬────────┐ │
│  │DESC      │DATE    │QTY │UNIT PRICE│AMOUNT  │ │  ← navy header
│  │Community │30-06-26│ 1  │$1150 USD │$1150..│ │  ← warm stripe
│  └──────────┴────────┴────┴──────────┴────────┘ │
│                                                  │
│                          Subtotal    $1150 USD   │
│                          Tax (VAT W) $0 USD      │
│                          ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰   │  ← navy "TOTAL DUE" band
│                          TOTAL DUE   $1150 USD   │
│                                                  │
│  PAYMENT INSTRUCTIONS                            │
│  ACCOUNT NAME          P/E ROMAN MARKUZE         │
│  ACCOUNT NUMBER (IBAN) GE62TB7611636615100028    │  ← mono font
│  ...                                             │
│                                                  │
│  NOTES & TERMS                                   │
│  Payment is due within 7 days...                 │
│                                                  │
│  ───────── (bronze) ─────────                    │
│  THANK YOU FOR YOUR BUSINESS                     │
│                                                  │
│  ────────────────────────────────────────────    │  ← footer separator
│  Invoice INV-CN-XXX    VAT WAIVED INVOICE   P1   │  ← footer band
│              computer-generated, no signature    │
└──────────────────────────────────────────────────┘
```

## Color tokens (do not change without redesign)

| Token | Hex | Used for |
|---|---|---|
| `HEADER_FILL` | `#2c3e50` | Section header backgrounds (charges table header, totals band) |
| `ACCENT` | `#8c7225` | Top accent band, bronze dividers, footer "VAT WAIVED" badge, section headings |
| `CARD_BG` | `#f7f6f4` | Bill From / Bill To card background |
| `TABLE_STRIPE` | `#f4f3f1` | Alternating row stripe in charges table |
| `BORDER` | `#dad5c8` | Card borders |
| `BORDER_LIGHT` | `#e8e5df` | Subtle separators (footer line, payment rows) |
| `TEXT_PRIMARY` | `#1f2330` | All body text |
| `TEXT_MUTED` | `#6b6862` | Labels, addresses, meta text |

## Why JSON input (not just prompt mode)

Prompt mode (`--prompt "INV-004 $1150"`) is fast for one-offs but doesn't capture:

- Custom dates (defaults to today)
- Per-invoice service description overrides
- Different buyers per invoice
- VAT status changes
- Custom footer notes

JSON input captures all of these and is also **diff-friendly** — you can version-control monthly invoice batches in git and see exactly what changed month-over-month. The prompt parser is a fallback for "I just need a quick invoice" moments.

## Why `vat_status` is a string, not a number

The format `"WAIVED"` vs `"TAXABLE:18"` vs `"TAXABLE:0"` encodes both the rate AND the semantic label. A bare number like `0` is ambiguous — does it mean "0% tax" (taxable but rate is zero) or "tax doesn't apply" (waived)? The string format makes the legal/semantic distinction explicit, which matters for cross-border invoices where "waived" and "0% taxable" have different compliance meanings.

## Why notes is a template string with `{inv_no}` / `{currency}`

The notes section references the invoice number and currency. If these were hardcoded, you'd have to manually substitute them per invoice. Using Python's `str.format()` with named placeholders means the same notes template works for every invoice regardless of number or currency. Just don't put user-controlled content into `notes` without escaping — `str.format` will fail on stray `{` characters.

## Extension points (if you need to fork)

- **Add a logo**: reserve a 30×30mm slot at top-left of the title block, embed via `Image()` flowable. Pass logo path through `defaults.logo_path`.
- **Multi-page line items**: replace the single-row charges table with a multi-row Table, set `repeatRows=1`, and let ReportLab paginate. Will need to revise the totals section to use `KeepTogether` so it stays with the last row.
- **Different page size (Letter)**: change `pagesize=A4` to `pagesize=letter` in `SimpleDocTemplate`. Adjust `colWidths` since Letter is 8.5" wide vs A4's 8.27".
- **CSV input**: write a 20-line `parse_csv()` function that reads `invoice_number,amount,service_description` rows and builds the same `data` dict. Plug into `main()` alongside `parse_prompt`.
