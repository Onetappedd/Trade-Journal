'use client';
import { AuthProvider } from "@/providers/auth-provider";
import RQProvider from "@/components/providers/query-client-provider";
import { Toaster } from "@/components/ui/sonner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RQProvider>
        {children}
        <Toaster richColors closeButton />
      </RQProvider>
    </AuthProvider>
  );
}
