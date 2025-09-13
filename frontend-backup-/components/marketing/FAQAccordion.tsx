'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQ } from './copy';

export function FAQAccordion() {
  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[--pp-text] mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-[--pp-muted]">
            Everything you need to know about ProfitPad
          </p>
        </div>

        <Accordion 
          type="single" 
          collapsible 
          className="w-full space-y-4"
          aria-label="Frequently asked questions"
        >
          {FAQ.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-[--pp-card] border border-[--pp-border] rounded-lg px-6"
            >
              <AccordionTrigger className="text-left text-[--pp-text] hover:text-[--pp-accent] transition-colors py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-[--pp-muted] pb-4 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-[--pp-muted] mb-4">
            Still have questions?
          </p>
          <a 
            href="mailto:support@profitpad.com" 
            className="text-[--pp-accent] hover:text-[--pp-accent]/80 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] rounded"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}
