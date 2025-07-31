import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { TradeStoreProvider } from "@/components/trade-store";
import { TradeDataProvider } from "@/hooks/TradeDataProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Trade Journal",
  description: "A modern, multi-asset trading journal.",
};

import Particles from "@/components/Particles";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background text-foreground antialiased ${inter.className}`}
        style={{
          position: "relative",
          minHeight: "100vh",
          width: "100vw",
          overflowY: "auto",
        }}
      >
        {/* Fixed full-viewport particles background */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <Particles
            particleColors={["#ffffff", "#ffffff"]}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </div>
        {/* Main content above the background */}
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <TradeStoreProvider>
                <TradeDataProvider>
                  {children}
                </TradeDataProvider>
              </TradeStoreProvider>
            </AuthProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
