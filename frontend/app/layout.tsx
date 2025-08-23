// no "use client" here
import type { Metadata } from "next";
import ClientLayout from "./client-layout";
// ...any global css/font imports...

export const metadata: Metadata = {
  title: "Trade Journal",
  description: "…",
  // other fields...
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
