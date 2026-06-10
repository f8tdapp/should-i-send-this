import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Communication Intelligence for Modern Messaging. Understand how your message lands before you send it.";

export const metadata: Metadata = {
  metadataBase: new URL("https://textpanic.com"),
  title: "BetweenLines AI",
  description: siteDescription,
  alternates: {
    canonical: "https://textpanic.com",
  },
  openGraph: {
    title: "BetweenLines AI",
    description: siteDescription,
    url: "https://textpanic.com",
    siteName: "BetweenLines AI",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "BetweenLines AI social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BetweenLines AI",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*
        Body background is the outermost layer, but the page wrapper in app/page.tsx
        currently covers the full viewport and is the actual visible canvas behind the app card.
      */}
      <body className="min-h-full bg-[var(--background)] text-slate-950">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
