import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Display — headings, card titles, hero
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

// Body / UI — everything else
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Data — altitude chips, prices, booking codes, dates
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TITLE = "RiRoam — Roam the land of high passes";
const DESCRIPTION =
  "Book verified stays, tours, and rides across Ladakh. Ri (རི) means mountain — RiRoam is mountain roam.";

export const metadata: Metadata = {
  // Resolves relative OG/twitter image paths to absolute URLs, which social
  // crawlers require — without it a shared link renders as a bare URL.
  metadataBase: new URL(APP_URL),
  title: { default: TITLE, template: "%s · RiRoam" },
  description: DESCRIPTION,
  applicationName: "RiRoam",
  openGraph: {
    type: "website",
    siteName: "RiRoam",
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${bricolage.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
