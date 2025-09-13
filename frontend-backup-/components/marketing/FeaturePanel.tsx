'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Check } from 'lucide-react';

interface FeaturePanelProps {
  orientation: 'left' | 'right';
  eyebrow: string;
  title: string;
  lead: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
}

export function FeaturePanel({ 
  orientation, 
  eyebrow, 
  title, 
  lead, 
  bullets, 
  imageSrc, 
  imageAlt 
}: FeaturePanelProps) {
  const isRight = orientation === 'right';
  
  const content = (
    <div className="space-y-8">
      {/* Eyebrow */}
      <div className="inline-flex">
        <span className="text-sm font-medium text-[--pp-accent] uppercase tracking-wider">
          {eyebrow}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-bold text-[--pp-text] leading-tight">
        {title}
      </h3>

      {/* Lead */}
      <p className="text-xl text-[--pp-muted] leading-relaxed">
        {lead}
      </p>

      {/* Bullets */}
      <ul className="space-y-4">
        {bullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-6 h-6 bg-[--pp-accent]/10 rounded-full flex items-center justify-center mt-0.5">
              <Check className="w-4 h-4 text-[--pp-accent]" />
            </div>
            <span className="text-[--pp-text] leading-relaxed">
              {bullet}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const image = (
    <div className="relative">
      <div className="relative rounded-2xl border border-[--pp-border] shadow-lg overflow-hidden bg-gradient-to-br from-[--pp-card] to-[--pp-bg] p-2">
        <div className="relative rounded-xl overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={600}
            height={400}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      {isRight ? (
        <>
          <div className="lg:order-2">{image}</div>
          <div className="lg:order-1">{content}</div>
        </>
      ) : (
        <>
          <div>{content}</div>
          <div>{image}</div>
        </>
      )}
    </div>
  );
}
