'use client';
// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">Generate and download trading reports</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
          <h3 className="text-xl font-semibold mb-4">Trading Reports</h3>
          <p className="text-muted-foreground">
            This is the reports page. Report generation and download options will go here.
          </p>
        </div>
      </div>
    </div>
  );
}
