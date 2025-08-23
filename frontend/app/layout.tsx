// no "use client" here
import type { Metadata } from "next";
import Providers from "./providers";

export const metadata: Metadata = { title: "Trade Journal" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="app-wrapper">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
