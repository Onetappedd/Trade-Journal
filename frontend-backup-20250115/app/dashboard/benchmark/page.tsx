import type { Metadata } from 'next';
import { BenchmarkPage } from '@/components/benchmark-page';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Benchmark | Trading Journal',
  description: 'Compare your performance against market benchmarks',
};

export default function Benchmark() {
  return <BenchmarkPage />;
}
