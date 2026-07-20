import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SunStore — Multi-Store E-Commerce Platform",
  description: "SunStore is a multi-site e-commerce platform with super admin dashboard, store management, T-Bank payments, and CRM.",
  keywords: ["SunStore", "e-commerce", "multi-store", "T-Bank", "admin dashboard", "Next.js"],
  authors: [{ name: "SunStore" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SunStore — Multi-Store E-Commerce Platform",
    description: "Create and manage multiple online stores from a single super admin dashboard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
