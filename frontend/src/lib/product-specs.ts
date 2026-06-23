/**
 * Derives a tidy list of technical specs for a storefront product.
 *
 * Solar hardware is a spec-driven purchase, but the catalog schema has no
 * dedicated attributes table. We mine the structured bits (SKU, stock) plus
 * light parsing of the title/description, so every product page shows a real
 * specs table without requiring a data migration.
 */
import type { Product } from "@/types/api";

export interface ProductSpec {
  label: string;
  value: string;
}

interface Rule {
  re: RegExp;
  label: string;
  /** Called with the full match; returns the human value or null to skip. */
  value: (match: RegExpMatchArray, source: string) => string | null;
}

// Note: we avoid \b word boundaries — they are ASCII-only and silently fail
// for Cyrillic (e.g. "5 кВт" would never match). Use a Cyrillic-aware lookahead.
const END = /(?![а-яёa-z0-9])/i.source;

// Order matters: first match per rule wins.
const RULES: Rule[] = [
  {
    re: new RegExp(`(\\d[\\d\\s.,]*?)\\s*(М[Вв]т|мвт|кВт|квт|kW|KW|Вт|вт|W)${END}`, "i"),
    label: "Мощность",
    value: ([, n, u]) => {
      const num = n.replace(/\s/g, "").replace(",", ".").trim();
      const unit = u.replace("W", "Вт").replace("K", "к");
      return `${num} ${unit}`;
    }
  },
  {
    re: new RegExp(`КПД\\s*([0-9]+[.,]?[0-9]*)\\s*%${END}`, "i"),
    label: "КПД",
    value: ([, v]) => `${v.replace(",", ".")}%`
  },
  {
    // Matches "25 лет", "3 года", "25-летняя гарантия", "10-летнего срока".
    // Allows trailing adjective inflection then asserts a word boundary.
    re: new RegExp(`(\\d+)[\\s-]*(?:летн|годичн|лет|года|год)[а-яё]*${END}`, "i"),
    label: "Гарантия",
    value: ([, v]) => `${v} лет`
  },
  {
    re: new RegExp(`(\\d+)\\s*(?:цикл(?:ов|а)?|cycle)${END}`, "i"),
    label: "Ресурс",
    value: ([, v]) => `${v}+ циклов`
  },
  {
    re: new RegExp(`(\\d+)\\s*А[·\\s-]*ч${END}`, "i"),
    label: "Ёмкость",
    value: ([, v]) => `${v} А·ч`
  },
  {
    re: new RegExp(`(\\d+)\\s*В${END}`),
    label: "Напряжение",
    value: ([, v]) => `${v} В`
  },
  {
    re: /(бифациальн|двусторонн)/i,
    label: "Тип",
    value: () => "Бифациальная"
  },
  {
    re: /(монокристалл|mono)/i,
    label: "Тип",
    value: () => "Монокристалл"
  },
  {
    re: /(LiFePO4|литий-железо|LFP)/i,
    label: "Химия",
    value: () => "LiFePO4"
  },
  {
    re: /(MPPT)/i,
    label: "Контроллер",
    value: () => "MPPT"
  }
];

export function getProductSpecs(product: Product): ProductSpec[] {
  const source = `${product.title_ru} ${product.description_ru}`;
  const specs: ProductSpec[] = [];
  const usedLabels = new Set<string>();

  for (const rule of RULES) {
    if (usedLabels.has(rule.label)) continue;
    const match = source.match(rule.re);
    if (!match) continue;
    const value = rule.value(match, source);
    if (!value) continue;
    usedLabels.add(rule.label);
    specs.push({ label: rule.label, value });
  }

  // Always-present catalog facts so the table is never empty.
  if (!usedLabels.has("Артикул")) {
    specs.push({ label: "Артикул", value: product.sku });
  }
  if (product.category_name_ru) {
    specs.unshift({ label: "Категория", value: product.category_name_ru });
  }

  return specs;
}

/** Short benefit bullets distilled from the description for the highlights block. */
export function getProductHighlights(product: Product): string[] {
  const text = product.description_ru;
  // Split on sentence boundaries, keep the meaningful clauses.
  const clauses = text
    .split(/(?<=[.])\s+|;\s*/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && c.length < 120);

  return clauses.slice(0, 4);
}
