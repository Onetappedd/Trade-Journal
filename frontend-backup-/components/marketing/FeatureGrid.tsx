'use client';

import { 
  Upload, 
  Layers, 
  Calculator, 
  RefreshCw, 
  Search, 
  BarChart3, 
  Code, 
  Shield 
} from 'lucide-react';

interface FeatureGridProps {
  id: string;
}

const features = [
  {
    icon: Upload,
    title: "Auto-import pipeline",
    description: "CSV, Excel, IBKR Flex with dedupe and smart field mapping"
  },
  {
    icon: Layers,
    title: "Multi-asset support",
    description: "Equities, options, futures with proper multipliers and ticks"
  },
  {
    icon: Calculator,
    title: "Precision P&L (Decimal)",
    description: "No floating-point drift with decimal.js end-to-end"
  },
  {
    icon: RefreshCw,
    title: "Options lifecycle",
    description: "Assignment, exercise, expiry with synthetic executions"
  },
  {
    icon: Search,
    title: "Market scanner presets",
    description: "Gappers, RVOL, IV rank with customizable filters"
  },
  {
    icon: BarChart3,
    title: "TradingView + visx charts",
    description: "Professional charts with real-time data integration"
  },
  {
    icon: Code,
    title: "Extensible adapters",
    description: "Plugin architecture for new broker integrations"
  },
  {
    icon: Shield,
    title: "Privacy-first",
    description: "AES encryption + RLS policies per user"
  }
];

export function FeatureGrid({ id }: FeatureGridProps) {
  return (
    <section id={id} className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[--pp-text] mb-4">
            Built for serious traders
          </h2>
          <p className="text-lg text-[--pp-muted]">
            Professional-grade features that scale with your trading
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index} 
                className="bg-[--pp-card] border border-[--pp-border] rounded-lg p-6 hover:border-[--pp-accent]/30 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[--pp-accent]/10 rounded-lg flex items-center justify-center group-hover:bg-[--pp-accent]/20 transition-colors">
                    <IconComponent className="w-5 h-5 text-[--pp-accent]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[--pp-text]">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[--pp-muted] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
