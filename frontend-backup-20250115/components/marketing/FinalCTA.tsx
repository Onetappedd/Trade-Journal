'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-[--pp-card] to-[--pp-bg] border-t border-[--pp-border]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-[--pp-accent]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-[--pp-accent]" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-4xl md:text-5xl font-bold text-[--pp-text] mb-6 leading-tight">
          Turn your trades into insight.
        </h2>

        {/* Subcopy */}
        <p className="text-xl text-[--pp-muted] mb-10 max-w-2xl mx-auto leading-relaxed">
          Import in minutes, analyze with precision.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/login?intent=signup">
            <Button 
              size="lg" 
              className="bg-[--pp-accent] hover:bg-[--pp-accent]/90 text-white px-8 py-4 text-lg font-semibold rounded-2xl flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
            >
              Start your free trial
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          
          <Link href="/docs/demo">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-[--pp-border] text-[--pp-text] hover:bg-[--pp-card] px-8 py-4 text-lg font-semibold rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
            >
              See live demo
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[--pp-muted]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[--pp-accent] rounded-full"></div>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[--pp-accent] rounded-full"></div>
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[--pp-accent] rounded-full"></div>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
