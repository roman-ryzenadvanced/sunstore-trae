#!/usr/bin/env python3
"""
invoice_generator.py — Reusable PDF invoice generator.

Usage:
    python invoice_generator.py <input.json> [--out-dir <dir>]
    python invoice_generator.py --prompt "INV-CN-004 $1150, INV-CN-005 $200"

Input JSON schema (see examples/template.json):
{
  "defaults": {                      # optional — applied to every invoice unless overridden
    "seller": {...},
    "buyer":  {...},
    "invoice_date":   "30 June 2026",
    "service_date":   "30-06-2026",
    "service_description": "Community Ambassador Services",
    "currency": "USD",
    "vat_status": "WAIVED",          # "WAIVED" | "TAXABLE:<rate>"  e.g. "TAXABLE:18"
    "footer_note": "VAT WAIVED INVOICE",
    "payment_info": [ ... ]          # full bank details block
  },
  "invoices": [
    {
      "invoice_number": "INV-CN-004",
      "amount": 1150.00,
      "service_description": "Community Ambassador Services - July 2026",  # optional override
      ...
    },
    ...
  ]
}

Output: one PDF per invoice, saved to --out-dir (default /home/z/my-project/download).
"""
import argparse
import json
import os
import re
import sys
from copy import deepcopy
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily


# ─────────── Font Registration ───────────
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')

pdfmetrics.registerFont(TTFont('LiberationSans', f'{FONT_DIR}/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans-Bold', f'{FONT_DIR}/truetype/liberation/LiberationSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans-Italic', f'{FONT_DIR}/truetype/liberation/LiberationSans-Italic.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSans-BoldItalic', f'{FONT_DIR}/truetype/liberation/LiberationSans-BoldItalic.ttf'))
registerFontFamily(
    'LiberationSans',
    normal='LiberationSans', bold='LiberationSans-Bold',
    italic='LiberationSans-Italic', boldItalic='LiberationSans-BoldItalic'
)

pdfmetrics.registerFont(TTFont('LiberationMono', f'{FONT_DIR}/truetype/liberation/LiberationMono-Regular.ttf'))
pdfmetrics.registerFont(TTFont('LiberationMono-Bold', f'{FONT_DIR}/truetype/liberation/LiberationMono-Bold.ttf'))
registerFontFamily('LiberationMono', normal='LiberationMono', bold='LiberationMono-Bold')


# ─────────── Palette (navy + bronze — professional invoice look) ───────────
PAGE_BG       = colors.HexColor('#ffffff')
SECTION_BG    = colors.HexColor('#ebeae8')
CARD_BG       = colors.HexColor('#f7f6f4')
TABLE_STRIPE  = colors.HexColor('#f4f3f1')
HEADER_FILL   = colors.HexColor('#2c3e50')           # deep navy
COVER_BLOCK   = colors.HexColor('#5b543f')
BORDER        = colors.HexColor('#dad5c8')
BORDER_LIGHT  = colors.HexColor('#e8e5df')
ICON          = colors.HexColor('#9b8953')
ACCENT        = colors.HexColor('#8c7225')           # bronze
ACCENT_2      = colors.HexColor('#3891ae')
TEXT_PRIMARY  = colors.HexColor('#1f2330')
TEXT_MUTED    = colors.HexColor('#6b6862')


# ─────────── Built-in defaults (Roman → JINGSHENG, TBC Bank) ───────────
BUILTIN_DEFAULTS = {
    "seller": {
        "name": "Roman Markuze",
        "address": "Bezhan Kalandadze 3, Batumi, Georgia",
        "contact": "+995 597 98 12 15",
    },
    "buyer": {
        "company_name": "JINGSHENG HENGXING TECHNOLOGY PTE. LTD.",
        "country": "Singapore",
    },
    "invoice_date": datetime.now().strftime("%-d %B %Y"),
    "service_date": datetime.now().strftime("%d-%m-%Y"),
    "service_description": "Community Ambassador Services",
    "currency": "USD",
    "vat_status": "WAIVED",               # produces "VAT WAIVED INVOICE" footer + $0.00 tax line
    "footer_note": "VAT WAIVED INVOICE",  # text shown in footer band; set null/empty to hide
    "payment_info": [
        ("Account Name",              "P/E ROMAN MARKUZE"),
        ("Account Number (IBAN)",     "GE62TB7611636615100028"),
        ("Bank Name",                 "JSC TBC Bank"),
        ("Bank Address",              "Tbilisi, Georgia"),
        ("SWIFT Code",                "TBCBGE22"),
        ("Country",                   "Georgia"),
        ("Telephone Number",          "+995 597 98 12 15"),
        ("Intermediary Bank",         "Citibank N.A., New York, USA (SWIFT: CITIUS33)"),
    ],
    "notes": (
        "Payment is due within 7 days of the invoice date. All bank charges and intermediary fees "
        "are to be borne by the payer. Please reference the invoice number "
        "{inv_no} in the payment description to ensure proper crediting. "
        "Services are rendered remotely from Batumi, Georgia. "
        "This invoice is issued in {currency} and is payable in {currency} only."
    ),
}


# ─────────── Styles ───────────
def make_styles():
    return {
        "invoice_title": ParagraphStyle('InvoiceTitle',
            fontName='LiberationSans-Bold', fontSize=36, leading=40,
            textColor=HEADER_FILL, alignment=TA_LEFT),
        "invoice_subtitle": ParagraphStyle('InvoiceSubtitle',
            fontName='LiberationSans', fontSize=10, leading=14,
            textColor=TEXT_MUTED, alignment=TA_LEFT),
        "seller_name": ParagraphStyle('SellerName',
            fontName='LiberationSans-Bold', fontSize=13, leading=17,
            textColor=TEXT_PRIMARY, alignment=TA_LEFT),
        "seller_addr": ParagraphStyle('SellerAddr',
            fontName='LiberationSans', fontSize=9.5, leading=13,
            textColor=TEXT_MUTED, alignment=TA_LEFT),
        "label": ParagraphStyle('Label',
            fontName='LiberationSans-Bold', fontSize=8, leading=11,
            textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=2),
        "label_right": ParagraphStyle('LabelRight',
            fontName='LiberationSans-Bold', fontSize=8, leading=11,
            textColor=TEXT_MUTED, alignment=TA_RIGHT, spaceAfter=2),
        "field_value": ParagraphStyle('FieldValue',
            fontName='LiberationSans-Bold', fontSize=11, leading=15,
            textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=1),
        "field_value_right": ParagraphStyle('FieldValueRight',
            fontName='LiberationSans-Bold', fontSize=11, leading=15,
            textColor=TEXT_PRIMARY, alignment=TA_RIGHT, spaceAfter=1),
        "field_sub": ParagraphStyle('FieldSub',
            fontName='LiberationSans', fontSize=9.5, leading=13,
            textColor=TEXT_MUTED, alignment=TA_LEFT),
        "field_sub_right": ParagraphStyle('FieldSubRight',
            fontName='LiberationSans', fontSize=9.5, leading=13,
            textColor=TEXT_MUTED, alignment=TA_RIGHT),
        "section_heading": ParagraphStyle('SectionHeading',
            fontName='LiberationSans-Bold', fontSize=10, leading=13,
            textColor=ACCENT, alignment=TA_LEFT, spaceAfter=4),
        "th": ParagraphStyle('TableHeader',
            fontName='LiberationSans-Bold', fontSize=9, leading=12,
            textColor=colors.white, alignment=TA_LEFT),
        "th_center": ParagraphStyle('TableHeaderCenter',
            fontName='LiberationSans-Bold', fontSize=9, leading=12,
            textColor=colors.white, alignment=TA_CENTER),
        "th_right": ParagraphStyle('TableHeaderRight',
            fontName='LiberationSans-Bold', fontSize=9, leading=12,
            textColor=colors.white, alignment=TA_RIGHT),
        "td": ParagraphStyle('TableCell',
            fontName='LiberationSans', fontSize=10, leading=14,
            textColor=TEXT_PRIMARY, alignment=TA_LEFT),
        "td_center": ParagraphStyle('TableCellCenter',
            fontName='LiberationSans', fontSize=10, leading=14,
            textColor=TEXT_PRIMARY, alignment=TA_CENTER),
        "td_right": ParagraphStyle('TableCellRight',
            fontName='LiberationSans', fontSize=10, leading=14,
            textColor=TEXT_PRIMARY, alignment=TA_RIGHT),
        "td_mono_right": ParagraphStyle('TableCellMonoRight',
            fontName='LiberationMono', fontSize=10, leading=14,
            textColor=TEXT_PRIMARY, alignment=TA_RIGHT),
        "total_label": ParagraphStyle('TotalLabel',
            fontName='LiberationSans-Bold', fontSize=11, leading=15,
            textColor=TEXT_PRIMARY, alignment=TA_RIGHT),
        "total_value": ParagraphStyle('TotalValue',
            fontName='LiberationSans-Bold', fontSize=12, leading=16,
            textColor=HEADER_FILL, alignment=TA_RIGHT),
        "grand_total_label": ParagraphStyle('GrandTotalLabel',
            fontName='LiberationSans-Bold', fontSize=12, leading=16,
            textColor=colors.white, alignment=TA_RIGHT),
        "grand_total_value": ParagraphStyle('GrandTotalValue',
            fontName='LiberationSans-Bold', fontSize=14, leading=18,
            textColor=colors.white, alignment=TA_RIGHT),
        "pay_label": ParagraphStyle('PayLabel',
            fontName='LiberationSans-Bold', fontSize=9.5, leading=14,
            textColor=TEXT_MUTED, alignment=TA_LEFT),
        "pay_value": ParagraphStyle('PayValue',
            fontName='LiberationSans', fontSize=9.5, leading=14,
            textColor=TEXT_PRIMARY, alignment=TA_LEFT),
        "pay_value_mono": ParagraphStyle('PayValueMono',
            fontName='LiberationMono', fontSize=9.5, leading=14,
            textColor=TEXT_PRIMARY, alignment=TA_LEFT),
        "thank_you": ParagraphStyle('ThankYou',
            fontName='LiberationSans-Bold', fontSize=10, leading=13,
            textColor=ACCENT, alignment=TA_LEFT),
    }


def fmt_money(v: float, currency: str = "USD") -> str:
    return f"${v:,.2f} {currency}"


# ─────────── Page decorations ───────────
def make_page_decoration(footer_note: str):
    """Return a canvas decorator with optional 'VAT WAIVED INVOICE' style footer note."""
    def page_decoration(canvas, doc):
        canvas.saveState()
        w, h = A4
        # Top accent band
        canvas.setFillColor(ACCENT)
        canvas.rect(0, h - 6 * mm, w, 6 * mm, fill=1, stroke=0)
        # Footer separator
        canvas.setStrokeColor(BORDER_LIGHT)
        canvas.setLineWidth(0.5)
        canvas.line(20 * mm, 14 * mm, w - 20 * mm, 14 * mm)
        # Footer note (e.g. "VAT WAIVED INVOICE") — bold accent, centered above meta line
        if footer_note:
            canvas.setFont('LiberationSans-Bold', 9)
            canvas.setFillColor(ACCENT)
            canvas.drawCentredString(w / 2, 17 * mm, footer_note)
        # Meta line
        canvas.setFont('LiberationSans', 8)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawString(20 * mm, 9 * mm, f"Invoice {doc.invoice_number}")
        canvas.drawCentredString(w / 2, 9 * mm,
                                 "This is a computer-generated invoice and is valid without signature.")
        canvas.drawRightString(w - 20 * mm, 9 * mm, f"Page {doc.page}")
        canvas.restoreState()
    return page_decoration


# ─────────── Merge defaults with per-invoice overrides ───────────
def merge_invoice(inv: dict, defaults: dict) -> dict:
    """Deep-merge an invoice entry over the defaults block."""
    merged = deepcopy(defaults)
    for k, v in inv.items():
        if k in ("seller", "buyer") and isinstance(v, dict):
            merged[k] = {**merged.get(k, {}), **v}
        elif k == "payment_info" and isinstance(v, list):
            merged[k] = v   # full replacement — payment info is a flat list
        else:
            merged[k] = v
    return merged


# ─────────── Parse VAT status → (label, rate, tax_amount_fn) ───────────
def parse_vat_status(status: str, subtotal: float):
    """
    Returns (tax_label, tax_amount).
    status formats:
      "WAIVED"        → ("Tax (VAT Waived)", 0.00)
      "TAXABLE:18"    → ("Tax (18% VAT)",   subtotal * 0.18)
      "TAXABLE:0"     → ("Tax (0%)",        0.00)
      "" / None       → ("Tax (0%)",        0.00)
    """
    if not status:
        return ("Tax (0%)", 0.00)
    s = str(status).strip().upper()
    if s == "WAIVED":
        return ("Tax (VAT Waived)", 0.00)
    m = re.match(r"TAXABLE\s*:\s*([\d.]+)", s)
    if m:
        rate = float(m.group(1))
        return (f"Tax ({rate}% VAT)", round(subtotal * rate / 100.0, 2))
    return ("Tax (0%)", 0.00)


# ─────────── Build a single invoice PDF ───────────
def build_invoice(inv_data: dict, output_path: str):
    S = make_styles()
    inv_no = inv_data["invoice_number"]
    amount = float(inv_data["amount"])
    currency = inv_data.get("currency", "USD")
    seller = inv_data.get("seller", {})
    buyer = inv_data.get("buyer", {})
    invoice_date = inv_data.get("invoice_date", "")
    service_date = inv_data.get("service_date", "")
    service_desc = inv_data.get("service_description", "")
    payment_info = inv_data.get("payment_info", [])
    footer_note = inv_data.get("footer_note", "")
    notes_tpl = inv_data.get("notes", "")

    vat_status = inv_data.get("vat_status", "WAIVED")
    tax_label, tax_amount = parse_vat_status(vat_status, amount)
    total_due = round(amount + tax_amount, 2)

    class InvoiceDoc(SimpleDocTemplate):
        invoice_number = inv_no

    doc = InvoiceDoc(
        output_path,
        pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=15 * mm, bottomMargin=20 * mm,
        title=f"Invoice {inv_no}",
        author=seller.get("name", "Invoice"),
        subject=f"Invoice {inv_no} - {service_desc}",
        creator="Z.ai",
    )

    story = []

    # ── Title + meta row ──
    title_block = [
        Paragraph("INVOICE", S["invoice_title"]),
        Spacer(1, 2),
        Paragraph(f"FOR {service_desc.upper()}", S["invoice_subtitle"]),
    ]
    meta_block = [
        Paragraph("INVOICE NO.", S["label_right"]),
        Paragraph(inv_no, S["field_value_right"]),
        Spacer(1, 4),
        Paragraph("DATE", S["label_right"]),
        Paragraph(invoice_date, S["field_value_right"]),
        Spacer(1, 4),
        Paragraph("AMOUNT DUE", S["label_right"]),
        Paragraph(fmt_money(total_due, currency), S["field_value_right"]),
    ]
    top_table = Table([[title_block, meta_block]], colWidths=[95 * mm, 75 * mm])
    top_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(top_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=HEADER_FILL, spaceBefore=0, spaceAfter=2))
    story.append(HRFlowable(width="100%", thickness=0.5, color=ACCENT, spaceBefore=0, spaceAfter=10))

    # ── Bill From / Bill To ──
    bill_from_block = [
        Paragraph("BILL FROM", S["label"]),
        Paragraph(seller.get("name", ""), S["field_value"]),
        Paragraph(seller.get("address", ""), S["field_sub"]),
    ]
    if seller.get("contact"):
        bill_from_block += [
            Spacer(1, 4),
            Paragraph("CONTACT", S["label"]),
            Paragraph(seller["contact"], S["field_sub"]),
        ]

    bill_to_block = [
        Paragraph("BILL TO", S["label"]),
        Paragraph(buyer.get("company_name", ""), S["field_value"]),
        Paragraph(buyer.get("country", ""), S["field_sub"]),
        Spacer(1, 4),
        Paragraph("SERVICES", S["label"]),
        Paragraph(service_desc, S["field_sub"]),
    ]
    bill_table = Table([[bill_from_block, bill_to_block]], colWidths=[85 * mm, 85 * mm])
    bill_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, BORDER),
        ('LINEABOVE', (0, 0), (-1, -1), 1, ACCENT),
    ]))
    story.append(bill_table)
    story.append(Spacer(1, 12))

    # ── Charges table ──
    story.append(Paragraph("CHARGES", S["section_heading"]))
    line_items_data = [[
        Paragraph("DESCRIPTION", S["th"]),
        Paragraph("DATE", S["th_center"]),
        Paragraph("QTY", S["th_center"]),
        Paragraph("UNIT PRICE", S["th_right"]),
        Paragraph("AMOUNT", S["th_right"]),
    ], [
        Paragraph(service_desc, S["td"]),
        Paragraph(service_date, S["td_center"]),
        Paragraph("1", S["td_center"]),
        Paragraph(fmt_money(amount, currency), S["td_mono_right"]),
        Paragraph(fmt_money(amount, currency), S["td_mono_right"]),
    ]]
    items_table = Table(line_items_data,
                        colWidths=[55 * mm, 25 * mm, 15 * mm, 35 * mm, 40 * mm],
                        repeatRows=1)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 1), (-1, 1), TABLE_STRIPE),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, HEADER_FILL),
        ('LINEBELOW', (0, -1), (-1, -1), 0.5, BORDER),
        ('BOX', (0, 0), (-1, -1), 0.25, BORDER_LIGHT),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10))

    # ── Totals ──
    totals_data = [
        [Paragraph("", S["td"]),
         Paragraph("Subtotal", S["total_label"]),
         Paragraph(fmt_money(amount, currency), S["total_value"])],
        [Paragraph("", S["td"]),
         Paragraph(tax_label, S["total_label"]),
         Paragraph(fmt_money(tax_amount, currency), S["total_value"])],
        [Paragraph("", S["td"]),
         Paragraph("TOTAL DUE", S["grand_total_label"]),
         Paragraph(fmt_money(total_due, currency), S["grand_total_value"])],
    ]
    totals_table = Table(totals_data, colWidths=[60 * mm, 60 * mm, 50 * mm])
    totals_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, 1), 0.4, BORDER_LIGHT),
        ('BACKGROUND', (0, 2), (-1, 2), HEADER_FILL),
        ('TOPPADDING', (0, 2), (-1, 2), 10),
        ('BOTTOMPADDING', (0, 2), (-1, 2), 10),
        ('LINEABOVE', (0, 0), (-1, 0), 0.5, BORDER),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 14))

    # ── Payment info ──
    if payment_info:
        story.append(Paragraph("PAYMENT INSTRUCTIONS", S["section_heading"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=0, spaceAfter=8))
        pay_rows = []
        for label, value in payment_info:
            is_code = any(k in label.upper() for k in ["IBAN", "SWIFT", "ACCOUNT NUMBER"])
            value_style = S["pay_value_mono"] if is_code else S["pay_value"]
            pay_rows.append([
                Paragraph(label.upper(), S["pay_label"]),
                Paragraph(str(value), value_style),
            ])
        pay_table = Table(pay_rows, colWidths=[55 * mm, 115 * mm])
        pay_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LINEBELOW', (0, 0), (-1, -2), 0.3, BORDER_LIGHT),
        ]))
        story.append(pay_table)
        story.append(Spacer(1, 10))

    # ── Notes & Terms ──
    if notes_tpl:
        story.append(Paragraph("NOTES & TERMS", S["section_heading"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=0, spaceAfter=6))
        notes_text = notes_tpl.format(inv_no=inv_no, currency=currency)
        notes_style = ParagraphStyle('Notes',
            fontName='LiberationSans', fontSize=9, leading=12,
            textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY)
        story.append(Paragraph(notes_text, notes_style))
        story.append(Spacer(1, 8))

    # ── Thank you bar ──
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceBefore=2, spaceAfter=4))
    story.append(Paragraph("THANK YOU FOR YOUR BUSINESS", S["thank_you"]))

    # ── Build ──
    doc.build(story,
              onFirstPage=make_page_decoration(footer_note),
              onLaterPages=make_page_decoration(footer_note))
    return output_path


# ─────────── Prompt-mode parser: "INV-001 $1150, INV-002 $200, ..." ───────────
def parse_prompt(prompt: str) -> list:
    """
    Parse a free-text prompt like:
        "INV-CN-004 $1150, INV-CN-005 $200, INV-CN-006 $150"
        "Generate July invoices: INV-CN-004 = $1150; INV-CN-005 = $200"
        "INV-CN-004: 1150, INV-CN-005: 200"
    Returns a list of {invoice_number, amount} dicts.

    Strategy: find invoice-number tokens first, then for each, scan forward
    for the next dollar amount (handles commas, decimals, $ prefix, and
    trailing punctuation gracefully).
    """
    # Match invoice numbers like INV-CN-004, INV-2026-001, INV005, INVOICE-007, etc.
    # Greedy on the full token including all hyphen-separated parts; the trailing part must be digits.
    inv_pattern = re.compile(r'\b([A-Z]{2,8}(?:-[A-Z0-9]+)*-\d{2,8}|[A-Z]{2,8}\d{3,8})\b', re.IGNORECASE)
    # Match dollar amounts: optional $, digits with optional thousands commas and decimal part.
    # Order matters: try the comma-grouped + decimal form FIRST, then the plain numeric form.
    amt_pattern = re.compile(
        r'\$?\s*('
        r'\d{1,3}(?:,\d{3})+(?:\.\d{2})?'   # 1,150 or 1,150.00
        r'|\d+\.\d{2}'                       # 1150.00
        r'|\d+(?:\.\d+)?'                    # 1150 or 1150.5
        r')'
    )

    inv_matches = list(inv_pattern.finditer(prompt))
    if not inv_matches:
        raise ValueError(
            "Could not parse any invoice entries from prompt. "
            "Expected format: 'INV-CN-004 $1150, INV-CN-005 $200'"
        )

    items = []
    for i, inv_m in enumerate(inv_matches):
        inv_no = inv_m.group(1).upper()
        # Search window: from after this invoice number to the start of the next one (or end)
        search_start = inv_m.end()
        search_end = inv_matches[i + 1].start() if i + 1 < len(inv_matches) else len(prompt)
        window = prompt[search_start:search_end]

        amt_m = amt_pattern.search(window)
        if not amt_m:
            print(f"  ! Warning: no amount found for {inv_no}, skipping", file=sys.stderr)
            continue

        # Strip commas (thousands separator) before parsing
        amount_str = amt_m.group(1).replace(',', '')
        try:
            amount = float(amount_str)
        except ValueError:
            print(f"  ! Warning: could not parse amount '{amt_m.group(1)}' for {inv_no}, skipping", file=sys.stderr)
            continue

        items.append({"invoice_number": inv_no, "amount": amount})

    if not items:
        raise ValueError("Found invoice numbers but no valid amounts in prompt.")
    return items


# ─────────── Main ───────────
def main():
    ap = argparse.ArgumentParser(description="Generate professional PDF invoices.")
    ap.add_argument("input", nargs="?", help="Path to JSON input file")
    ap.add_argument("--prompt", help="Free-text invoice list, e.g. 'INV-001 $1150, INV-002 $200'")
    ap.add_argument("--out-dir", default="/home/z/my-project/download",
                    help="Output directory (default: /home/z/my-project/download)")
    args = ap.parse_args()

    if not args.input and not args.prompt:
        ap.error("Provide either a JSON input file or --prompt")

    os.makedirs(args.out_dir, exist_ok=True)

    # ── Build invoice list ──
    if args.prompt:
        items = parse_prompt(args.prompt)
        data = {"defaults": BUILTIN_DEFAULTS, "invoices": items}
    else:
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Apply builtin defaults for any missing top-level keys
        merged_defaults = deepcopy(BUILTIN_DEFAULTS)
        merged_defaults.update(data.get("defaults", {}))
        data["defaults"] = merged_defaults

    defaults = data["defaults"]
    invoices = data["invoices"]

    print(f"Generating {len(invoices)} invoice(s) → {args.out_dir}")
    print("-" * 60)
    for inv in invoices:
        merged = merge_invoice(inv, defaults)
        out_path = os.path.join(args.out_dir, f"{merged['invoice_number']}.pdf")
        build_invoice(merged, out_path)
        print(f"  ✓ {merged['invoice_number']}.pdf  ({fmt_money(merged['amount'], merged.get('currency','USD'))})")
    print("-" * 60)
    print(f"Done. {len(invoices)} invoice(s) in {args.out_dir}")


if __name__ == '__main__':
    main()
