import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full text-center animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl">404 – Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">Sorry, the page you are looking for does not exist.</p>
          <Button asChild variant="default">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
