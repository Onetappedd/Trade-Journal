import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - Riskr',
  description: 'Documentation and help for Riskr',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="prose prose-gray max-w-none dark:prose-invert">
        {children}
      </div>
    </div>
  );
}
