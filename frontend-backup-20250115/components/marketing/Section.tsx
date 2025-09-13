import { Badge } from '@/components/ui/badge';

interface SectionProps {
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ eyebrow, title, lead, children, className = '' }: SectionProps) {
  return (
    <section className={`py-24 md:py-32 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        {(eyebrow || title || lead) && (
          <div className="text-center mb-16">
            {eyebrow && (
              <Badge variant="secondary" className="bg-[--pp-accent]/10 text-[--pp-accent] border-[--pp-accent]/20 mb-4">
                {eyebrow}
              </Badge>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-[--pp-text] mb-6">
                {title}
              </h2>
            )}
            {lead && (
              <p className="text-xl text-[--pp-muted] max-w-3xl mx-auto leading-relaxed">
                {lead}
              </p>
            )}
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    </section>
  );
}
