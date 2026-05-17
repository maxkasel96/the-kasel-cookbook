import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthAnalyticsTracker from "./components/auth-analytics-tracker";
import GoogleTagManager, { GoogleTagManagerNoScript } from "./components/gtm";
import PwaServiceWorker from "./components/pwa-service-worker";
import SiteHeader from "./components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "The Kasel Cookbook",
  title: {
    default: "The Kasel Cookbook",
    template: "%s | The Kasel Cookbook",
  },
  description:
    "A family cookbook for browsing recipes, planning meals, saving favorites, and building a shared shopping list.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Kasel Cookbook",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "The Kasel Cookbook",
    description:
      "Browse family recipes, plan meals, save favorites, and build a shared shopping list.",
    siteName: "The Kasel Cookbook",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleTagManager gtmId={gtmId} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden antialiased`}
      >
        <GoogleTagManagerNoScript gtmId={gtmId} />
        <Suspense fallback={null}>
          <AuthAnalyticsTracker />
        </Suspense>
        <PwaServiceWorker />
        <div className="min-h-screen bg-background text-foreground">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
