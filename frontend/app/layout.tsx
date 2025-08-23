// no "use client" here
import type { Metadata } from "next";
import Providers from "./providers";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

export const metadata: Metadata = { title: "Trade Journal" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>
          {typeof Header !== "undefined" ? <Header /> : null}
          <div className="app-wrapper">
            {typeof Sidebar !== "undefined" ? <Sidebar /> : null}
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
