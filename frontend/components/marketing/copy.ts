export const HERO = {
  title: "Journal smarter. Trade better.",
  subtitle: "ProfitPad auto-imports trades and computes precise P&L across equities, options, and futures—turning your history into an edge.",
  ctaPrimary: "Start free",
  ctaSecondary: "See live demo"
};

export const FEATURES = {
  import: {
    title: "Auto-import from any broker",
    subtitle: "Connect your accounts or upload CSV files. We handle the rest.",
    bullets: [
      "One-click imports from 20+ brokers",
      "CSV/Excel file upload support",
      "Email import automation",
      "Real-time trade synchronization"
    ]
  },
  analytics: {
    title: "Advanced portfolio analytics",
    subtitle: "Get insights that matter with professional-grade analytics.",
    bullets: [
      "Real-time P&L tracking",
      "Performance attribution analysis",
      "Risk metrics and drawdown analysis",
      "Custom reporting and exports"
    ]
  },
  options: {
    title: "Professional options pricing",
    subtitle: "Black-Scholes, Greeks, and implied volatility at your fingertips.",
    bullets: [
      "Multiple pricing models (BS, Binomial, BAW)",
      "Real-time Greeks calculation",
      "Implied volatility solving",
      "Options chain analysis"
    ]
  }
};

export const PRICING = {
  title: "Simple, transparent pricing",
  subtitle: "Start free, scale as you grow",
  tiers: [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Up to 100 trades per month",
        "Basic P&L tracking",
        "CSV import (up to 1,000 rows)",
        "Email support"
      ],
      cta: "Get started",
      popular: false
    },
    {
      name: "Pro",
      price: "$20",
      period: "per month",
      description: "For serious traders",
      features: [
        "Unlimited trades",
        "Advanced analytics & charts",
        "All import formats (CSV, Excel, IBKR Flex)",
        "Options lifecycle tracking",
        "Portfolio performance metrics",
        "Priority support",
        "API access",
        "Custom reports"
      ],
      cta: "Start free trial",
      popular: true
    }
  ]
};

export const FAQ = [
  {
    question: "How does the free trial work?",
    answer: "Start with our free plan immediately. No credit card required. Upgrade to Pro anytime to unlock unlimited trades and advanced features."
  },
  {
    question: "Which brokers do you support?",
    answer: "We support 20+ major brokers including Alpaca, Tradier, IBKR, TastyTrade, and more. We're constantly adding new integrations."
  },
  {
    question: "Can I import historical data?",
    answer: "Yes! Upload CSV files or connect your broker account to import your entire trading history. We'll automatically categorize and analyze your trades."
  },
  {
    question: "How accurate is the options pricing?",
    answer: "We use industry-standard models including Black-Scholes, CRR Binomial, and Barone-Adesi-Whaley. All calculations are verified against professional trading platforms."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level encryption, SOC 2 compliance, and never store your broker credentials. Your data is yours and yours alone."
  },
  {
    question: "Can I export my data?",
    answer: "Yes, you can export your trades, analytics, and reports in multiple formats including CSV, PDF, and Excel."
  },
  {
    question: "Do you support futures trading?",
    answer: "Yes! We support equities, options, and futures with proper contract multipliers and P&L calculations for each instrument type."
  },
  {
    question: "What if I need help getting started?",
    answer: "We offer comprehensive documentation, video tutorials, and email support. Pro users get priority support with faster response times."
  }
];

export const TESTIMONIALS = [
  {
    quote: "ProfitPad transformed how I track my trades. The auto-import feature alone saves me hours every week.",
    author: "Sarah Chen",
    role: "Day Trader",
    avatar: "/marketing/avatars/sarah.jpg"
  },
  {
    quote: "Finally, a trading analytics platform that understands options. The Greeks calculations are spot-on and the analytics are professional-grade.",
    author: "Mike Rodriguez",
    role: "Options Trader",
    avatar: "/marketing/avatars/mike.jpg"
  },
  {
    quote: "The portfolio analytics helped me identify patterns I never noticed before. My win rate improved by 15% in the first month.",
    author: "Alex Thompson",
    role: "Swing Trader",
    avatar: "/marketing/avatars/alex.jpg"
  },
  {
    quote: "As a professional trader, I need reliable tools. ProfitPad delivers with enterprise-grade security and accuracy.",
    author: "Dr. Emily Watson",
    role: "Quantitative Trader",
    avatar: "/marketing/avatars/emily.jpg"
  }
];

export const SECURITY = {
  title: "Enterprise-grade security",
  subtitle: "Your data is protected with bank-level security",
  bullets: [
    "SOC 2 Type II compliant",
    "256-bit AES encryption",
    "Never store broker credentials",
    "Regular security audits",
    "GDPR and CCPA compliant",
    "Two-factor authentication"
  ]
};

export const INTEGRATIONS = {
  title: "Works with your favorite brokers",
  subtitle: "Connect your existing accounts in minutes",
  brokers: [
    { name: "Alpaca", logo: "/marketing/logos/alpaca.svg" },
    { name: "Tradier", logo: "/marketing/logos/tradier.svg" },
    { name: "IBKR", logo: "/marketing/logos/ibkr.svg" },
    { name: "TastyTrade", logo: "/marketing/logos/tasty.svg" },
    { name: "TradingView", logo: "/marketing/logos/tradingview.svg" }
  ]
};

export const FINAL_CTA = {
  title: "Ready to transform your trading?",
  subtitle: "Join thousands of traders who've improved their performance with ProfitPad",
  ctaPrimary: "Start your free trial",
  ctaSecondary: "Schedule a demo"
};
