import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import StructuredData from "@/components/StructuredData";
import "./globals.css";
import SentryInitializer from "@/components/SentryInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lawndesk.pro"),
  title: "LawnDesk - Less paperwork, more yardwork",
  description: "The simplest business management tool for landscaping professionals.",
  keywords: "lawn care, landscaping, business management, invoicing, scheduling, worker management",
  authors: [{ name: "LawnDesk" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://lawndesk.pro",
    title: "LawnDesk - Less paperwork, more yardwork",
    description: "The simplest business management tool for landscaping professionals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LawnDesk - Business management for landscapers",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LawnDesk - Less paperwork, more yardwork",
    description: "The simplest business management tool for landscaping professionals.",
    images: ["/og-image.png"],
    creator: "@lawndesk",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <head>
        <StructuredData />
      </head>
      <body className="min-h-full bg-gray-100">
        <SentryInitializer />
        {children}
      </body>
    </html>
  );
}
