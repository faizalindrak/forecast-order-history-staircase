import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MRP - Forecast Order History Staircase",
  description: "Material Requirements Planning (MRP) system with forecast order history staircase visualization. Delta mode for tracking changes between order snapshots.",
  keywords: ["MRP", "Material Requirements Planning", "Forecast", "Order History", "Staircase", "Delta", "Manufacturing", "Supply Chain"],
  authors: [{ name: "MRP Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MRP - Forecast Order History Staircase",
    description: "Advanced MRP system with visual staircase forecasting and delta tracking for order history management",
    url: "https://mrp-forecast.example.com",
    siteName: "MRP Forecast System",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MRP - Forecast Order History Staircase",
    description: "Advanced MRP system with visual staircase forecasting and delta tracking for order history management",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <MobileNav />
              <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
