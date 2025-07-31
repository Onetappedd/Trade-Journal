"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  if (typeof window === "undefined") return null;

  const { user, logout, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    // Fetch profile from backend
    setLoading(true);
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setForm({ username: data.username || "", email: data.email || "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isAuthenticated, router, token]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Handle profile update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: form.username }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess("Profile updated successfully");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.detail || "Failed to update profile");
    }
  };

  // Handle password change (local only)
  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    // In a real app, update password in backend here
    setPwSuccess("Password changed successfully (local only)");
    setPwForm({ oldPassword: "", newPassword: "" });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-xl w-full mx-auto mt-8 md:mt-16 px-4 md:px-8 py-8 bg-card rounded-2xl shadow-2xl flex flex-col gap-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-8 text-center">Profile</h1>
      {loading ? (
        <div className="text-center text-lg py-8">Loading...</div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="block text-base md:text-lg font-semibold mb-1">Username</label>
              <Input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full p-3 md:p-4 text-base md:text-lg"
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-base md:text-lg font-semibold mb-1">Email</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 md:p-4 text-base md:text-lg"
                autoComplete="email"
              />
            </div>
            {error && <div className="text-red-500 text-center text-sm md:text-base">{error}</div>}
            {success && <div className="text-green-600 text-center text-sm md:text-base">{success}</div>}
            <div className="flex flex-col md:flex-row gap-4 justify-between mt-2 md:mt-4">
              <Button type="submit" variant="default" size="lg" className="w-full md:w-auto px-8 py-3 text-base md:text-lg">Update Profile</Button>
              <Button type="button" variant="outline" size="lg" className="w-full md:w-auto px-8 py-3 text-base md:text-lg" onClick={logout}>Logout</Button>
            </div>
          </form>
          <form onSubmit={handlePwChange} className="flex flex-col gap-6 border-t pt-8">
            <h2 className="text-xl font-bold mb-2 text-center">Change Password</h2>
            <div className="flex flex-col gap-2">
              <label className="block text-base md:text-lg font-semibold mb-1">Current Password</label>
              <Input
                name="oldPassword"
                type="password"
                value={pwForm.oldPassword}
                onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                className="w-full p-3 md:p-4 text-base md:text-lg"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-base md:text-lg font-semibold mb-1">New Password</label>
              <Input
                name="newPassword"
                type="password"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full p-3 md:p-4 text-base md:text-lg"
                autoComplete="new-password"
                required
              />
            </div>
            {pwError && <div className="text-red-500 text-center text-sm md:text-base">{pwError}</div>}
            {pwSuccess && <div className="text-green-600 text-center text-sm md:text-base">{pwSuccess}</div>}
            <Button type="submit" variant="default" size="lg" className="w-full md:w-auto px-8 py-3 text-base md:text-lg">Change Password</Button>
          </form>
        </>
      )}
    </div>
  );
}
