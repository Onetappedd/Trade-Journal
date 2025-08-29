import "./globals.css";
import { Inter } from 'next/font/google';

import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Trade Journal",
  description: "Modern trading dashboard",
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