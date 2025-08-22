'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

const reportTemplates = [
  {
    name: 'Monthly Performance Report',
    description: 'Comprehensive monthly trading performance analysis',
    icon: BarChart3,
    lastGenerated: '2024-01-15',
  },
  {
    name: 'Tax Summary Report',
    description: 'Annual tax reporting with realized gains/losses',
    icon: FileText,
    lastGenerated: '2024-01-01',
  },
  {
    name: 'Strategy Analysis Report',
    description: 'Performance breakdown by trading strategy',
    icon: TrendingUp,
    lastGenerated: '2024-01-10',
  },
  {
    name: 'Risk Assessment Report',
    description: 'Portfolio risk metrics and analysis',
    icon: DollarSign,
    lastGenerated: '2024-01-12',
  },
];

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <Badge variant="outline">4 Templates Available</Badge>
      </div>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>
            Create a personalized report with your preferred parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance Summary</SelectItem>
                  <SelectItem value="tax">Tax Report</SelectItem>
                  <SelectItem value="strategy">Strategy Analysis</SelectItem>
                  <SelectItem value="risk">Risk Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="PDF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid gap-6 md:grid-cols-2">
        {reportTemplates.map((template) => (
          <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <template.icon className="mr-2 h-5 w-5" />
                {template.name}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Last generated: {template.lastGenerated}
                </p>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your recently generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                name: 'January 2024 Performance Report',
                date: '2024-01-15',
                size: '2.3 MB',
                format: 'PDF',
              },
              { name: 'Q4 2023 Tax Summary', date: '2024-01-01', size: '1.8 MB', format: 'Excel' },
              {
                name: 'Strategy Analysis - December',
                date: '2023-12-31',
                size: '1.2 MB',
                format: 'PDF',
              },
              { name: 'Risk Assessment Report', date: '2023-12-28', size: '956 KB', format: 'PDF' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.date} • {report.size} • {report.format}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
