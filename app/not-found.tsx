import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-xl font-bold">Trading Journal</span>
          </div>
          <CardTitle>404 - Page Not Found</CardTitle>
          <CardDescription>The page you're looking for doesn't exist or has been moved.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
