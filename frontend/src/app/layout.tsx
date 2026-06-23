import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/toaster";

import "./globals.css";

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap'
});

// Display face referenced by the Solar Panels theme (var(--font-display)).
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
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
    <html lang="ru">
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
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
