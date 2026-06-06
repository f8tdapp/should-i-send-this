import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Should I Send This?",
  description: "Paste your message and find out how it actually sounds.",
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
      </body>
    </html>
  );
}
