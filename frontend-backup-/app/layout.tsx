import "./globals.css";
import { Inter } from 'next/font/google';

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
  title: "Riskr",
  description: "Trade Journaling & Analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

return (
  <html lang="en" suppressHydrationWarning className={inter.variable}>
    <body className="font-sans antialiased">
      <Providers>{children}</Providers>
    </body>
  </html>
);

}