import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WatchlistProvider } from "./components/WatchlistProvider";
import { BottomNav, SideNav } from "./components/Nav";
import { PwaSupport } from "./components/PwaSupport";
import { SearchNavigationProvider } from "./components/SearchNavigation";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { getSiteSettings } from "@/lib/content";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://civicsync-ph-gamma.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CivicSync PH", template: "%s · CivicSync PH" },
  openGraph: { siteName: "CivicSync PH", type: "website", locale: "en_PH" },
  twitter: { card: "summary_large_image" },
  description: "Receipts and a Civic Watchlist for Philippine legislation.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "CivicSync", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { socialLinks } = await getSiteSettings();
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-paper font-sans text-gray-900 antialiased">
        <WatchlistProvider>
          <SearchNavigationProvider>
            <div className="md:flex">
              <SideNav socialLinks={socialLinks} />
              <div className="min-w-0 flex-1">
                <AnnouncementBanner />
                {/* Phone: narrow column above the tab bar. Tablet/desktop: wider, no tab bar. */}
                <div className="mx-auto min-h-screen max-w-md pb-[calc(80px+env(safe-area-inset-bottom))] md:max-w-3xl md:px-4 md:pb-12 lg:max-w-6xl lg:px-8">
                  {children}
                </div>
              </div>
            </div>
            <BottomNav />
          </SearchNavigationProvider>
          <PwaSupport />
        </WatchlistProvider>
        {/* Cookieless, aggregate page-view counts; no personal data or cross-site tracking. */}
        <Analytics />
      </body>
    </html>
  );
}
