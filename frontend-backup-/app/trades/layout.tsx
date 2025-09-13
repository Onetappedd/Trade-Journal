import { AppShell } from '@/components/layout/AppShell';

export default function TradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
