import type { Metadata } from 'next';
import { AlertsPage } from '@/components/alerts-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Price Alerts - Riskr',
  description: 'Manage your price alerts and notifications',
};

export default function Alerts() {
  return <AlertsPage />;
}
