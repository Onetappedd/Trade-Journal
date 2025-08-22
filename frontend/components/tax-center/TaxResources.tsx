'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Calculator, FileText, HelpCircle } from 'lucide-react';

const resources = [
  {
    title: 'IRS Publication 550',
    description: 'Investment Income and Expenses (Including Capital Gains and Losses)',
    url: 'https://www.irs.gov/pub/irs-pdf/p550.pdf',
    icon: FileText,
  },
  {
    title: 'Tax Loss Harvesting Guide',
    description: 'Strategies to minimize your tax liability through strategic selling',
    url: '#',
    icon: BookOpen,
  },
  {
    title: 'Capital Gains Calculator',
    description: 'Calculate your potential tax liability on investment gains',
    url: '#',
    icon: Calculator,
  },
  {
    title: 'Wash Sale Rules',
    description: 'Understanding the 30-day wash sale rule and its implications',
    url: '#',
    icon: HelpCircle,
  },
];

export function TaxResources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Tax Resources & Help
        </CardTitle>
        <CardDescription>
          Educational resources and tools to help you understand trading taxes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <resource.icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <h4 className="font-medium">{resource.title}</h4>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                <Button variant="outline" size="sm" className="h-8 bg-transparent" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    Learn More <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Important Disclaimer</h4>
          <p className="text-sm text-muted-foreground">
            This information is for educational purposes only and should not be considered tax
            advice. Please consult with a qualified tax professional or CPA for personalized tax
            guidance regarding your specific trading activities and tax situation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
