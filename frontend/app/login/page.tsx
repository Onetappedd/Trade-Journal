"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginRegisterPage() {
  if (typeof window === "undefined") return null;
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.detail || "Registration failed");
          setLoading(false);
          return;
        }
        // Auto-login after registration
      }
      // Login
      const loginRes = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: form.username,
          password: form.password,
        }).toString(),
      });
      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => ({}));
        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }
      // For local auth, just call login and redirect
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-8 bg-card rounded-2xl shadow-2xl">
      <div className="flex justify-center mb-8 gap-4">
        <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Login</Button>
        <Button variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>Register</Button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-lg font-semibold mb-2">Username</label>
          <Input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full p-4 text-lg"
            autoComplete="username"
            required
          />
        </div>
        {mode === "register" && (
          <div>
            <label className="block text-lg font-semibold mb-2">Email</label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-4 text-lg"
              autoComplete="email"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-lg font-semibold mb-2">Password</label>
          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-4 text-lg"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>
        {error && <div className="text-red-500 text-center">{error}</div>}
        <Button type="submit" variant="default" size="lg" className="px-8 py-3 text-lg" disabled={loading}>
          {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
        </Button>
      </form>
    </div>
  );
}
