import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WatchlistProvider } from "./components/WatchlistProvider";
import { BottomNav } from "./components/BottomNav";
import { PwaSupport } from "./components/PwaSupport";

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
          <div className="mx-auto min-h-screen max-w-md pb-[calc(80px+env(safe-area-inset-bottom))]">{children}</div>
          <BottomNav />
          <PwaSupport />
        </WatchlistProvider>
      </body>
    </html>
  );
}
