"use client";
import { Sidebar } from "@/components/layout/sidebar";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col items-center justify-center px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Settings</h1>
        <div className="max-w-xl w-full bg-card rounded-lg shadow p-8 flex flex-col gap-6 items-center">
          <div className="text-lg text-muted-foreground text-center">Settings and account management coming soon.</div>
        </div>
      </div>
    </div>
  );
}
