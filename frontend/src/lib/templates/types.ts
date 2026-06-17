/**
 * Template System Type Definitions
 * 
 * Defines the structure for 20 different niche templates.
 * Each template has unique branding, colors, typography, and content.
 */

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
}

export interface TypographyTokens {
  displayFont: string;
  bodyFont: string;
  displayWeight: number;
  bodyWeight: number;
  baseSize: string;
  scaleRatio: number;
}

export interface SpacingTokens {
  shellMaxWidth: string;
  sectionPadding: string;
  cardRadius: string;
  buttonRadius: string;
}

export interface TemplateBranding {
  storeName: string;
  tagline: string;
  description: string;
  logoMark: string; // SVG path or character
  iconColor: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
}

export interface TemplateProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  price_kopecks: number;
  sku: string;
  stock_quantity: number;
  images: string[];
  category_id: string;
  is_active: boolean;
}

export interface Template {
  id: string;
  name: string;
  niche: string;
  description: string;
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  branding: TemplateBranding;
  categories: TemplateCategory[];
  products: TemplateProduct[];
  heroCopy: {
    eyebrow: string;
    headline: string;
    subhead: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  sections: {
    showFeatured: boolean;
    showCollections: boolean;
    showTestimonials: boolean;
    showNewsletter: boolean;
  };
}

export type TemplateId = string;
