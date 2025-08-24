import type { Metadata } from 'next';
import { ScannerPage } from '@/components/scanner-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Market Scanner - Trading Journal',
  description: 'Scan the market for trading opportunities',
};

export default function Scanner() {
  return <ScannerPage />;
}
