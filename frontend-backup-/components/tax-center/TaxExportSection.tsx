'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';

export function TaxExportSection() {
  const handleExportPDF = () => {
    // Dummy function - would generate PDF report
    console.log('Exporting PDF tax report...');
  };

  const handleExportCSV = () => {
    // Dummy function - would generate CSV export
    console.log('Exporting CSV tax data...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Tax Reports
        </CardTitle>
        <CardDescription>
          Generate comprehensive tax reports for your accountant or tax filing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExportPDF} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export PDF Report
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Table className="h-4 w-4" />
            Export CSV Data
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          PDF includes summary, detailed trade list, and tax calculations. CSV contains raw trade
          data for custom analysis.
        </p>
      </CardContent>
    </Card>
  );
}
