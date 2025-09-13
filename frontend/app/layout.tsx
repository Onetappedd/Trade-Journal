import "./globals.css";
import { Inter } from 'next/font/google';
import ConditionalLayout from "@/components/conditional-layout";

import Providers from './providers';

// Initialize Sentry monitoring (no-op if DSN not provided)
import '@/lib/monitoring';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "RiskR - Professional Trading Analytics",
  description: "Advanced trading journal and portfolio analytics platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}