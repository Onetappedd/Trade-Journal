'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PRICING } from './copy';

interface PricingTableProps {
  id: string;
}

export function PricingTable({ id }: PricingTableProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const tiers = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      features: PRICING.tiers[0].features,
      cta: 'Start free',
      popular: false
    },
    {
      name: 'Pro',
      price: 20,
      description: 'For serious traders',
      features: PRICING.tiers[1].features,
      cta: 'Start free trial',
      popular: true
    }
  ];

  const annualDiscount = 2; // 2 months free
  const annualMultiplier = 10; // 10 months instead of 12

  return (
    <section id={id} className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[--pp-text] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-[--pp-muted] mb-8">
            Start free, upgrade when you're ready
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-[--pp-text]' : 'text-[--pp-muted]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] ${
                isAnnual ? 'bg-[--pp-accent]' : 'bg-[--pp-border]'
              }`}
              aria-label="Toggle billing period"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-[--pp-text]' : 'text-[--pp-muted]'}`}>
              Annual
              {isAnnual && (
                <Badge variant="secondary" className="ml-2 bg-[--pp-accent]/10 text-[--pp-accent] border-[--pp-accent]/20">
                  2 months free
                </Badge>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier, index) => {
            const displayPrice = isAnnual 
              ? Math.round(tier.price * annualMultiplier) 
              : tier.price;
            
            return (
              <div
                key={tier.name}
                className={`relative bg-[--pp-card] border rounded-lg p-8 ${
                  tier.popular 
                    ? 'border-[--pp-accent] shadow-lg scale-105' 
                    : 'border-[--pp-border]'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[--pp-accent] text-white px-3 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Most popular
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[--pp-text] mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-[--pp-muted] mb-4">
                    {tier.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[--pp-text]">
                      ${displayPrice}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-[--pp-muted] ml-1">
                        /{isAnnual ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-[--pp-accent]/10 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-[--pp-accent]" />
                      </div>
                      <span className="text-[--pp-text] text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="text-center">
                  {tier.name === 'Free' || tier.name === 'Pro' ? (
                    <Link href="/login?intent=signup">
                                             <Button 
                         className={`w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg] ${
                           tier.popular 
                             ? 'bg-[--pp-accent] hover:bg-[--pp-accent]/90 text-white' 
                             : 'bg-transparent border border-[--pp-border] text-[--pp-text] hover:bg-[--pp-card]'
                         }`}
                       >
                        {tier.cta}
                      </Button>
                    </Link>
                  ) : (
                                         <Button 
                       variant="outline" 
                       className="w-full border-[--pp-border] text-[--pp-text] hover:bg-[--pp-card] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--pp-focus-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--pp-bg]"
                     >
                      {tier.cta}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-[--pp-muted]">
            All plans include 7-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
