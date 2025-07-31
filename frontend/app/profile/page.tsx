// frontend/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ username: "", email: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/auth/login");
    }
  }, [user, router]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("username,email")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setForm({ username: data.username, email: data.email });
        }
        setLoading(false);
      });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase
      .from("profiles")
      .update({ username: form.username })
      .eq("id", user.id);

    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Profile updated successfully");
  };

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    // Stubbed: implement real backend call if desired
    setPwSuccess("Password changed successfully (local only)");
    setPwForm({ oldPassword: "", newPassword: "" });
  };

  if (!user) return null; // or a loading spinner

  return (
    <div className="max-w-xl w-full mx-auto mt-8 md:mt-16 px-4 md:px-8 py-8 bg-card rounded-2xl shadow-2xl flex flex-col gap-8">
      <h1 className="text-3xl md:text-4xl font-bold text-center">Profile</h1>

      {loading ? (
        <div className="text-center text-lg py-8">Loading...</div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="block text-base md:text-lg font-semibold">Username</label>
              <Input
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block text-base md:text-lg font-semibold">Email</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled
              />
            </div>
            {error && <div className="text-red-500 text-center">{error}</div>}
            {success && <div className="text-green-600 text-center">{success}</div>}
            <div className="flex flex-col md:flex-row gap-4 justify-between mt-2">
              <Button type="submit" size="lg" className="w-full md:w-auto">
                Update Profile
              </Button>
              <Button onClick={signOut} variant="outline" size="lg" className="w-full md:w-auto">
                Logout
              </Button>
            </div>
          </form>

          <form onSubmit={handlePwChange} className="flex flex-col gap-6 border-t pt-8">
            <h2 className="text-xl font-bold text-center">Change Password</h2>
            <div className="flex flex-col gap-2">
              <label className="font-semibold">Current Password</label>
              <Input
                name="oldPassword"
                type="password"
                value={pwForm.oldPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold">New Password</label>
              <Input
                name="newPassword"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                autoComplete="new-password"
                required
              />
            </div>
            {pwError && <div className="text-red-500 text-center">{pwError}</div>}
            {pwSuccess && <div className="text-green-600 text-center">{pwSuccess}</div>}
            <Button type="submit" size="lg" className="w-full md:w-auto">
              Change Password
            </Button>
          </form>
        </>
      )}
    </div>
);
}
