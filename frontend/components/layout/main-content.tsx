import React from "react";

export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-h-screen px-8 py-6">
      {children}
    </main>
  );
}
