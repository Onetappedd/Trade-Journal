import { BackgroundChartAnimation } from "@/components/auth/background-chart-animation"
import { EnhancedLoginForm } from "@/components/auth/enhanced-login-form"
import { AuthProvider } from "@/components/auth/enhanced-auth-provider"
import { FinancialTicker } from "@/components/auth/financial-ticker"
import { TerminalCaret } from "@/components/auth/terminal-caret"

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4 pb-16 overflow-hidden">
        <BackgroundChartAnimation />
        <TerminalCaret />
        <EnhancedLoginForm />
        <FinancialTicker />
      </div>
    </AuthProvider>
  )
}
