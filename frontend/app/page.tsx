'use client';

import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { Hero } from '@/components/marketing/Hero';
import { LogoStrip } from '@/components/marketing/LogoStrip';
import { Section } from '@/components/marketing/Section';
import { FeaturePanel } from '@/components/marketing/FeaturePanel';
import { LiveDemoBand } from '@/components/marketing/LiveDemoBand';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { Integrations } from '@/components/marketing/Integrations';
import { SecurityPanel } from '@/components/marketing/SecurityPanel';
import { PricingTable } from '@/components/marketing/PricingTable';
import { Testimonials } from '@/components/marketing/Testimonials';
import { FAQAccordion } from '@/components/marketing/FAQAccordion';
import { FinalCTA } from '@/components/marketing/FinalCTA';

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ProfitPad",
    "description": "Auto-import trades, compute precise multi-asset P&L, and analyze performance with options tools and a market scanner.",
    "applicationCategory": "FinanceApplication",
    "url": "https://profitpad.com",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Perfect for getting started with basic trading journal features"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "12",
        "priceCurrency": "USD",
        "description": "For serious traders with advanced analytics and options tools"
      }
    ],
    "operatingSystem": "Web",
    "datePublished": "2024-01-01",
    "publisher": {
      "@type": "Organization",
      "name": "ProfitPad"
    }
  };

  return (
    <div className="font-sans min-h-screen bg-[--pp-bg] text-[--pp-text]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4">
          <div className="space-y-20">
            <Hero />
            <LogoStrip />
            
            {/* Auto-Import & Normalization */}
            <Section>
              <FeaturePanel
                orientation="left"
                eyebrow="Data Import"
                title="Auto-Import & Normalization"
                lead="CSV, Email, Manual. Dedupe on import. Smart matching groups fills into trades."
                bullets={[
                  "CSV/Excel & IBKR Flex parsing",
                  "Hash-based dedupe + DB unique index",
                  "FIFO equities, multi-leg options, futures ticks",
                  "Split-aware display adjustments"
                ]}
                imageSrc="/marketing/panel-import.png"
                imageAlt="ProfitPad import interface showing CSV upload, field mapping, and data normalization"
              />
            </Section>

          {/* Analytics & P&L */}
          <Section>
            <FeaturePanel
              orientation="right"
              eyebrow="Portfolio Analytics"
              title="Analytics & P&L"
              lead="Precision P&L with Decimal math, fees, multipliers, and ticks—no rounding drift."
              bullets={[
                "Realized P&L and fees roll-up",
                "Options multipliers & adjusted contracts",
                "Futures tick value + contract multipliers",
                "Symbol and period breakdowns"
              ]}
              imageSrc="/marketing/panel-analytics.png"
              imageAlt="ProfitPad analytics dashboard showing P&L charts, performance metrics, and portfolio breakdown"
            />
          </Section>

          {/* Options Calculator & Market Scanner */}
          <Section>
            <FeaturePanel
              orientation="left"
              eyebrow="Options & Scanner"
              title="Options Calculator & Market Scanner"
              lead="Black-Scholes & American approximation, live greeks, scenario sliders. Scanner presets to spot setups."
              bullets={[
                "Delta, Gamma, Theta, Vega, Rho",
                "IV slider + DTE presets",
                "Scanner presets: gappers, RVOL, IV rank",
                "TradingView charts on detail"
              ]}
              imageSrc="/marketing/panel-options.png"
              imageAlt="ProfitPad options calculator showing Greeks, IV slider, and market scanner with preset filters"
            />
          </Section>

          <LiveDemoBand id="live-demo" />
          <FeatureGrid id="features" />
          <Integrations />
          <SecurityPanel />
          <PricingTable id="pricing" />
          <Testimonials />
          <FAQAccordion />
          <FinalCTA />
        </div>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
