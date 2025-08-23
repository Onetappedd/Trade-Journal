'use client';
import RQProvider from "@/components/providers/query-client-provider";
import { Toaster } from "@/components/ui/sonner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RQProvider>
      {children}
      <Toaster richColors closeButton />
    </RQProvider>
  );
}
