"use client";
import { AuthProvider } from "@/components/providers/auth-provider";
import RQProvider from "@/components/providers/query-client-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RQProvider>{children}</RQProvider>
    </AuthProvider>
  );
}
