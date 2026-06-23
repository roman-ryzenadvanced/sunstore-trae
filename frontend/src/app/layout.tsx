import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/toaster";

import "./globals.css";

// Single geometric humanist typeface (close cousin of Yandex "YS Text" and
// Sberbank "SB Sans") with full Cyrillic coverage. Hierarchy is built from
// weight + size rather than a second family, the way both reference sites do.
const manrope = Manrope({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    default: "Sun Panels Store — premium solar panel showcase",
    template: "%s · Sun Panels Store"
  },
  description:
    "Элегантные солнечные панели для современного дома. Высококачественные решения с акцентом на эффективность и дизайн.",
  keywords: [
    "Sun Panels Store",
    "solar panels",
    "солнечные панели",
    "энергоэффективность",
    "зелёная энергия"
  ],
  authors: [{ name: "Sun Panels Store" }],
  openGraph: {
    title: "Sun Panels Store — premium solar panels",
    description:
      "Элегантные солнечные панели для современного дома.",
    type: "website",
    locale: "ru_RU"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        <div className="page-chrome" />
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <CartDrawer />
        <Toaster />
      </body>
    </html>
  );
}
