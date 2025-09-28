import type { Metadata } from 'next';
import { PortfolioPage } from '@/components/portfolio-page';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portfolio | Riskr',
  description: 'View your live portfolio and current positions',
};

export default function Portfolio() {
  return <PortfolioPage />;
}
