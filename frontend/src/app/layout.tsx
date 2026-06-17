import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { CartDrawer } from "@/components/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});

const body = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Sun.store",
  description: "Русская storefront и admin-панель для boutique e-commerce."
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
        <main>{children}</main>
        <SiteFooter />
        <CartDrawer />
      </body>
    </html>
  );
}
