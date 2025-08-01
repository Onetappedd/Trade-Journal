import { Loader2, TrendingUp } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <TrendingUp className="h-6 w-6" />
          <span className="text-xl font-bold">Trading Journal</span>
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
