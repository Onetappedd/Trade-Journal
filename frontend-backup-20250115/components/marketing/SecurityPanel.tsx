'use client';

import Link from 'next/link';
import { Shield, Lock, Trash2, Key } from 'lucide-react';
import { SECURITY } from './copy';

export function SecurityPanel() {
  const securityFeatures = [
    {
      icon: Lock,
      text: "Encryption at rest for sensitive fields"
    },
    {
      icon: Shield,
      text: "Row-level security per user"
    },
    {
      icon: Trash2,
      text: "Delete imports with cascade & rematch"
    },
    {
      icon: Key,
      text: "Optional OAuth broker connectors"
    }
  ];

  return (
    <section className="py-16 bg-[--pp-card] border-y border-[--pp-border]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-[--pp-text]">
              Privacy & Security
            </h2>
            <p className="text-lg text-[--pp-muted] leading-relaxed">
              Your data is protected with enterprise-grade security. We use bank-level encryption 
              and never store your broker credentials. Your trading data belongs to you.
            </p>
            <div className="flex items-center gap-4">
              <Link 
                href="/legal/privacy"
                className="inline-flex items-center gap-2 text-[--pp-accent] hover:text-[--pp-accent]/80 transition-colors font-medium"
              >
                Read our privacy policy
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right: Bullet List */}
          <div className="space-y-4">
            {securityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[--pp-accent]/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-[--pp-accent]" />
                  </div>
                  <span className="text-[--pp-text] leading-relaxed">
                    {feature.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
