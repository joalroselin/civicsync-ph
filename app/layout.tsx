import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WatchlistProvider } from "./components/WatchlistProvider";
import { BottomNav, SideNav } from "./components/Nav";
import { PwaSupport } from "./components/PwaSupport";
import { SearchNavigationProvider } from "./components/SearchNavigation";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "CivicSync PH", template: "%s · CivicSync PH" },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-paper font-sans text-gray-900 antialiased">
        <WatchlistProvider>
          <SearchNavigationProvider>
            <div className="md:flex">
              <SideNav />
              <div className="min-w-0 flex-1">
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
      </body>
    </html>
  );
}
