import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/toaster";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Sun.store — curated Russian boutique e-commerce",
    template: "%s · Sun.store"
  },
  description:
    "Тихая роскошь для вещей, которые хочется рассматривать медленно. Витрина вдохновлена Sun.store: светлая, коллекционная, с акцентом на редкие предметы.",
  keywords: [
    "Sun.store",
    "boutique",
    "e-commerce",
    "российский магазин",
    "тихая роскошь"
  ],
  authors: [{ name: "Sun.store" }],
  openGraph: {
    title: "Sun.store — curated Russian boutique",
    description:
      "Тихая роскошь для вещей, которые хочется рассматривать медленно.",
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
      <body className={`${display.variable} ${body.variable}`}>
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
