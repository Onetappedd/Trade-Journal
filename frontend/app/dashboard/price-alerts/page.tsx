import type { Metadata } from 'next';
import { PriceAlertsPage } from '@/components/price-alerts-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Price Alerts | Trading Journal',
  description: 'Set and manage price alerts for your watchlist',
};

export default function PriceAlerts() {
  return <PriceAlertsPage />;
}
