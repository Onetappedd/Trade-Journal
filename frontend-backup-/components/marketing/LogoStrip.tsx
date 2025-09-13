'use client';

import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { INTEGRATIONS } from './copy';

export function LogoStrip() {
  return (
    <section className="py-12 border-y border-[--pp-border]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-[--pp-muted] text-sm">
            Trusted by traders using
          </p>
        </div>
        
        <TooltipProvider>
          <div className="flex items-center justify-center gap-8 md:gap-12 opacity-60 grayscale">
            {INTEGRATIONS.brokers.map((broker) => (
              <Tooltip key={broker.name}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center w-20 h-12 transition-opacity hover:opacity-100">
                    <Image
                      src={broker.logo}
                      alt={`${broker.name} logo`}
                      width={80}
                      height={48}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{broker.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-[--pp-muted] cursor-help">
                  Integrations and compatibility vary; see docs
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p>Check our documentation for detailed integration status and feature availability</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </section>
  );
}
