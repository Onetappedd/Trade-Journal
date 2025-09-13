import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, ArrowLeft, TrendingUp } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">RiskR</span>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-emerald-500">404</h1>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Page Not Found</h2>
            <p className="text-slate-600 dark:text-slate-400">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1 bg-emerald-500 hover:bg-emerald-600">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <Link href="javascript:history.back()">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
