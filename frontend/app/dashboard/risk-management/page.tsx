import type { Metadata } from 'next';
import { RiskManagementPage } from '@/components/risk-management-page';

export const metadata: Metadata = {
  title: 'Risk Management | Trading Journal',
  description: 'Monitor and manage your trading risk metrics',
};

export default function RiskManagement() {
  return <RiskManagementPage />;
}
