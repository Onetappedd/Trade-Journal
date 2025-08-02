import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function BenchmarkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Benchmark</h2>
        <p className="text-muted-foreground">Compare your trading performance against market benchmarks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">vs S&P 500</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">vs NASDAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8.3%</div>
            <p className="text-xs text-muted-foreground">+1.8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.42</div>
            <p className="text-xs text-muted-foreground">Above market average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.85</div>
            <p className="text-xs text-muted-foreground">Lower volatility</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
