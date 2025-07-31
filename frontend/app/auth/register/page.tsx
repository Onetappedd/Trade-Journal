"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username) {
      setError("Username is required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const ok = await register(username, email, password);
    setLoading(false);
    if (ok) {
      router.push("/auth/login?registered=1");
    } else {
      setError("Username or email already exists");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">Username</label>
              <Input id="username" type="text" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm" className="block text-sm font-medium">Confirm Password</label>
              <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating account..." : "Sign up"}</Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account? <Link href="/auth/login" className="underline">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
