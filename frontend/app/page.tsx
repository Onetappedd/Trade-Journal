"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { LogIn, UserPlus, BarChart2, Lock, FileText, Tag, PieChart, TrendingUp, Import } from "lucide-react";

export default function LandingPage() {
  const { user, isAuthenticated, login, register } = useAuth();
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const ok = await login(loginForm.email, loginForm.password);
    setLoading(false);
    if (!ok) setLoginError("Invalid email or password");
    else router.push("/dashboard");
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    if (registerForm.password !== registerForm.confirm) {
      setRegisterError("Passwords do not match");
      return;
    }
    setLoading(true);
    const ok = await register(registerForm.username, registerForm.email, registerForm.password);
    setLoading(false);
    if (!ok) setRegisterError("Account already exists");
    else {
      setRegisterSuccess("Account created! You can now log in.");
      setRegisterForm({ username: "", email: "", password: "", confirm: "" });
    }
  };

  // Feature highlights
  const features = [
    {
      icon: <FileText className="h-7 w-7 text-primary" />, title: "Multi-Asset Journaling", desc: "Stocks, options, futures, crypto—all in one place."
    },
    {
      icon: <BarChart2 className="h-7 w-7 text-primary" />, title: "Deep Analytics Dashboard", desc: "Visualize P&L, win rate, R:R, and more."
    },
    {
      icon: <TrendingUp className="h-7 w-7 text-primary" />, title: "Real-Time TradingView Charts", desc: "Integrated charts for every trade."
    },
    {
      icon: <Tag className="h-7 w-7 text-primary" />, title: "Tagging & Notes", desc: "Organize trades with tags, notes, and psychology tracking."
    },
    {
      icon: <Lock className="h-7 w-7 text-primary" />, title: "Secure Accounts", desc: "Your data stays private and secure."
    },
    {
      icon: <Import className="h-7 w-7 text-primary" />, title: "Trade Import (Coming Soon)", desc: "CSV import for Webull, Robinhood, and more."
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/60">
      {/* Hero Section */}
      <header className="relative w-full flex flex-col items-center justify-center pt-16 pb-12 px-4 bg-gradient-to-br from-primary/10 to-background">
        <div className="flex items-center gap-3 mb-4">
          <PieChart className="h-10 w-10 text-primary" />
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight">Trade Journal</span>
        </div>
        <h1 className="text-center text-2xl md:text-3xl font-bold mb-4 text-foreground/90 max-w-2xl">
          The Ultimate Multi-Asset Trading Journal & Analytics Platform
        </h1>
        <p className="text-center text-lg md:text-xl text-muted-foreground max-w-xl mb-8">
          Track every trade, analyze your edge, and level up your performance with beautiful charts, deep analytics, and seamless journaling for stocks, options, futures, and crypto.
        </p>
        {!isAuthenticated && (
          <div className="flex gap-4 mb-2 flex-wrap justify-center">
            <Button size="lg" className="px-8 py-3 text-lg font-semibold" onClick={() => router.push("#auth")}>Register</Button>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg font-semibold" onClick={() => router.push("#auth")}>Log In</Button>
          </div>
        )}
      </header>

      {/* Features Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div key={f.title} className="flex flex-col items-center bg-card rounded-xl shadow p-6 border border-border h-full">
            <div className="mb-3">{f.icon}</div>
            <div className="text-lg font-bold mb-1 text-center">{f.title}</div>
            <div className="text-muted-foreground text-center text-base">{f.desc}</div>
          </div>
        ))}
      </section>

      {/* Auth Card or Welcome */}
      <section id="auth" className="w-full flex flex-col items-center justify-center py-12 px-4">
        <Card className="w-full max-w-2xl mx-auto shadow-xl border border-border">
          <CardContent className="py-10">
            {isAuthenticated ? (
              <div className="flex flex-col items-center gap-4">
                <div className="text-2xl font-bold mb-2">Welcome back{user?.email ? `, ${user.email}` : ""}!</div>
                <Button size="lg" className="px-8 py-3 text-lg font-semibold" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
              </div>
            ) : (
              <Tabs defaultValue="register" className="w-full">
                <TabsList className="w-full flex mb-8">
                  <TabsTrigger value="register" className="flex-1 text-lg">Register</TabsTrigger>
                  <TabsTrigger value="login" className="flex-1 text-lg">Log In</TabsTrigger>
                </TabsList>
                <TabsContent value="register">
                  <form className="flex flex-col gap-6" onSubmit={handleRegister}>
                    <Input
                      type="text"
                      placeholder="Username"
                      value={registerForm.username}
                      onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={registerForm.email}
                      onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={registerForm.password}
                      onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Confirm Password"
                      value={registerForm.confirm}
                      onChange={e => setRegisterForm(f => ({ ...f, confirm: e.target.value }))}
                      required
                    />
                    {registerError && <div className="text-red-500 text-center text-sm">{registerError}</div>}
                    {registerSuccess && <div className="text-green-600 text-center text-sm">{registerSuccess}</div>}
                    <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>Register</Button>
                  </form>
                </TabsContent>
                <TabsContent value="login">
                  <form className="flex flex-col gap-6" onSubmit={handleLogin}>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      required
                    />
                    {loginError && <div className="text-red-500 text-center text-sm">{loginError}</div>}
                    <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>Log In</Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto border-t border-border bg-background/80 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} Trade Journal. All rights reserved.
      </footer>
    </div>
  );
}
