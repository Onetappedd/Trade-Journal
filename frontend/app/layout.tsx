// no "use client" here
import type { Metadata } from "next";
import ClientLayout from "./client-layout";

export const metadata: Metadata = { title: "Trade Journal" };

// Force dynamic so auth pages don’t pre-render at build
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
