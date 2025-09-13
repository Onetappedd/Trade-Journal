'use client';

import Image from 'next/image';
import { INTEGRATIONS } from './copy';

export function Integrations() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-[--pp-text] mb-4">
          {INTEGRATIONS.title}
        </h2>
        <p className="text-lg text-[--pp-muted] mb-8">
          {INTEGRATIONS.subtitle}
        </p>
        
        {/* Blurb */}
        <p className="text-sm text-[--pp-muted] mb-12 max-w-2xl mx-auto">
          Live APIs optional. Start with CSV/Email.
        </p>
        
        {/* Logo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {INTEGRATIONS.brokers.map((broker) => (
            <div 
              key={broker.name} 
              className="flex items-center justify-center group"
            >
              <div className="relative w-20 h-12 transition-all duration-300 group-hover:scale-110">
                <Image
                  src={broker.logo}
                  alt={`${broker.name} logo`}
                  width={80}
                  height={48}
                  className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional info */}
        <div className="mt-8 text-xs text-[--pp-muted]">
          <p>Integrations and compatibility vary. See documentation for details.</p>
        </div>
      </div>
    </section>
  );
}
