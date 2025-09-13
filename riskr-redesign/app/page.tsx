import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Star,
  LineChart,
  PieChart,
  Activity,
  Target,
  Zap,
  Database,
  Brain,
  Lock,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/50 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">RiskR</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#analytics" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                Analytics
              </a>
              <a href="#features" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                Features
              </a>
              <a href="#insights" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                Insights
              </a>
              <a href="#pricing" className="text-slate-400 hover:text-emerald-400 transition-colors font-medium">
                Pricing
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-slate-300 hover:text-white hover:bg-slate-800"
                asChild
              >
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Start Trading</Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge
                  variant="secondary"
                  className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50 font-medium"
                >
                  <Activity className="h-3 w-3 mr-2" />
                  Professional Risk Analytics
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold text-balance leading-[0.9] tracking-tight">
                  Trade with
                  <span className="block text-emerald-400">Precision</span>
                </h1>
                <p className="text-xl text-slate-300 text-pretty max-w-xl leading-relaxed">
                  Advanced risk management platform engineered for institutional traders. Real-time P&L tracking,
                  portfolio optimization, and predictive analytics.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 h-12 font-medium"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent font-medium"
                >
                  View Demo
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">99.9%</div>
                  <div className="text-sm text-slate-400 font-medium">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">$2.4B+</div>
                  <div className="text-sm text-slate-400 font-medium">Assets Tracked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">15ms</div>
                  <div className="text-sm text-slate-400 font-medium">Latency</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-lg">Live Portfolio Analytics</h3>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-400">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="text-sm text-slate-400 mb-1">Total P&L</div>
                      <div className="text-2xl font-bold text-emerald-400">+$47,832</div>
                      <div className="text-xs text-emerald-400">+12.4% today</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <div className="text-sm text-slate-400 mb-1">Risk Score</div>
                      <div className="text-2xl font-bold text-amber-400">7.2</div>
                      <div className="text-xs text-slate-400">Moderate</div>
                    </div>
                  </div>

                  <div className="h-32 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <LineChart className="h-8 w-8 text-emerald-400 mx-auto" />
                      <p className="text-sm text-slate-400">Real-time Analytics</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-semibold text-white">847</div>
                      <div className="text-xs text-slate-400">Active Positions</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">23.7%</div>
                      <div className="text-xs text-slate-400">Win Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">2.4x</div>
                      <div className="text-xs text-slate-400">Sharpe Ratio</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 border-slate-700/50 font-medium">
              Platform Capabilities
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-balance text-white">Built for Professional Traders</h2>
            <p className="text-xl text-slate-400 text-pretty max-w-3xl mx-auto leading-relaxed">
              Enterprise-grade tools that scale with your trading operation. From real-time risk monitoring to advanced
              portfolio analytics.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-950/50 flex items-center justify-center group-hover:bg-emerald-900/50 transition-colors">
                  <Database className="h-6 w-6 text-emerald-400" />
                </div>
                <CardTitle className="text-xl text-white">Smart Data Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  Seamlessly connect with 50+ brokers and data providers. Automated reconciliation and real-time
                  synchronization.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300">Multi-broker aggregation</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300">Real-time position tracking</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-slate-300">Automated trade matching</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-950/50 flex items-center justify-center group-hover:bg-blue-900/50 transition-colors">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl text-white">AI-Powered Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  Machine learning algorithms analyze patterns and predict risk scenarios. Advanced portfolio
                  optimization and stress testing.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-300">Predictive risk modeling</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-300">Pattern recognition</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-slate-300">Automated alerts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-950/50 flex items-center justify-center group-hover:bg-purple-900/50 transition-colors">
                  <Lock className="h-6 w-6 text-purple-400" />
                </div>
                <CardTitle className="text-xl text-white">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  Bank-grade security with end-to-end encryption. SOC 2 compliant with multi-factor authentication.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-300">256-bit encryption</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-300">SOC 2 Type II certified</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                    <span className="text-slate-300">Role-based access control</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="analytics" className="py-24 bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge
                  variant="secondary"
                  className="bg-emerald-950/50 text-emerald-400 border-emerald-800/50 font-medium"
                >
                  <Target className="h-3 w-3 mr-2" />
                  Advanced Analytics
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-white text-balance">Real-time Risk Intelligence</h2>
                <p className="text-xl text-slate-400 text-pretty leading-relaxed">
                  Monitor portfolio performance with institutional-grade analytics. Get actionable insights that drive
                  better trading decisions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                  <div className="h-10 w-10 rounded-lg bg-emerald-950/50 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Lightning Fast Processing</div>
                    <div className="text-sm text-slate-400">Sub-millisecond trade execution analysis</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
                  <div className="h-10 w-10 rounded-lg bg-blue-950/50 flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Portfolio Optimization</div>
                    <div className="text-sm text-slate-400">AI-driven position sizing and risk allocation</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Risk Metrics</h4>
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">VaR (95%)</span>
                      <span className="text-white font-medium">$12.4K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Max Drawdown</span>
                      <span className="text-white font-medium">-2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Beta</span>
                      <span className="text-white font-medium">0.87</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Performance</h4>
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">YTD Return</span>
                      <span className="text-emerald-400 font-medium">+24.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Sharpe Ratio</span>
                      <span className="text-white font-medium">2.34</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Win Rate</span>
                      <span className="text-white font-medium">67.2%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800/50 p-6 col-span-2">
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Asset Allocation</h4>
                  <div className="h-20 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-center">
                    <div className="text-center space-y-1">
                      <PieChart className="h-6 w-6 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-500">Interactive Portfolio View</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 border-slate-700/50 font-medium">
              Client Success
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-white text-balance">Trusted by Industry Leaders</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  "RiskR transformed our risk management process. The real-time analytics and automated reporting saved
                  us 40+ hours per week."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">SC</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Sarah Chen</div>
                    <div className="text-sm text-slate-400">Head of Risk, Quantum Capital</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  "The AI-powered insights have given us a significant edge. Our Sharpe ratio improved by 35% since
                  implementing RiskR."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">Michael Rodriguez</div>
                    <div className="text-sm text-slate-400">Portfolio Manager, Apex Trading</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed">
                  "Enterprise-grade security with institutional performance. RiskR handles our $2B+ portfolio with
                  precision and reliability."
                </p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">DK</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">David Kim</div>
                    <div className="text-sm text-slate-400">CIO, Meridian Fund</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.05%3E%3Ccircle cx=30 cy=30 r=1/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="space-y-8 max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-white text-balance">Ready to Transform Your Trading?</h2>
            <p className="text-xl text-emerald-100 text-pretty leading-relaxed">
              Join 500+ institutional traders who rely on RiskR for professional risk management. Start your 14-day free
              trial—no setup fees, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-emerald-900 hover:bg-slate-100 text-lg px-8 h-12 font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12 border-emerald-300/30 text-white hover:bg-emerald-800/50 bg-transparent font-medium"
              >
                Schedule Demo
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-emerald-200 pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Enterprise support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 bg-slate-950 border-t border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">RiskR</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Professional risk management platform engineered for institutional traders and sophisticated investment
                firms.
              </p>
              <div className="flex space-x-4">
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <span className="text-slate-400 text-sm font-medium">Li</span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer">
                  <span className="text-slate-400 text-sm font-medium">Tw</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Risk Management
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Portfolio Optimization
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    API Access
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Case Studies
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Webinars
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-400">© 2024 RiskR Technologies. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-sm text-slate-400 mt-4 md:mt-0">
              <span>SOC 2 Type II Certified</span>
              <span>•</span>
              <span>ISO 27001 Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
