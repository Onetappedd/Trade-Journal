import { Inter } from 'next/font/google';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ProfitPad — The modern trade journal',
  description: 'Auto-import trades, compute precise multi-asset P&L, and analyze performance with options tools and a market scanner.',
  openGraph: {
    title: 'ProfitPad — The modern trade journal',
    description: 'Auto-import trades, compute precise multi-asset P&L, and analyze performance with options tools and a market scanner.',
    url: '/',
    siteName: 'ProfitPad',
    images: ['/marketing/og.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProfitPad — The modern trade journal',
    description: 'Auto-import trades, compute precise multi-asset P&L, and analyze performance with options tools and a market scanner.',
    images: ['/marketing/og.png'],
  },
  other: {
    'theme-color': '#0B0F14',
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-sans min-h-screen bg-[--pp-bg] text-[--pp-text]`}>
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
