'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { config } from '@/lib/config';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const USERNAME_REGEX = /^[a-z0-9]{3,15}$/;

export default function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createSupabaseClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const checkUsername = async (value: string) => {
    const v = value.toLowerCase();
    if (!USERNAME_REGEX.test(v)) {
      setUsernameStatus('invalid');
      setUsernameMsg('Username must be 3-15 lowercase letters or numbers.');
      return;
    }
    setUsernameStatus('checking');
    setUsernameMsg('Checking...');
    try {
      const res = await fetch(`/api/username-check?username=${v}`);
      const json = await res.json();
      if (res.ok && json.available) {
        setUsernameStatus('available');
        setUsernameMsg('Username is available');
      } else {
        setUsernameStatus('taken');
        setUsernameMsg('Username is already taken');
      }
    } catch (e) {
      setUsernameStatus('invalid');
      setUsernameMsg('Error checking username');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toLowerCase();
    setUsername(v);
    setUsernameStatus('idle');
    setUsernameMsg('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkUsername(v), 400);
  };

  const handleUsernameBlur = () => {
    if (username) checkUsername(username);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const v = username.toLowerCase();
    if (!USERNAME_REGEX.test(v)) {
      setUsernameStatus('invalid');
      setFormMsg('Invalid username format.');
      return;
    }

    // Re-check availability to avoid race condition
    const res = await fetch(`/api/username-check?username=${v}`);
    const json = await res.json();
    if (!res.ok || !json.available) {
      setUsernameStatus('taken');
      setFormMsg('Username is already taken.');
      return;
    }

    setLoading(true);

    // Sign up with Supabase Auth, storing username in user_metadata too
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username: v },
                                     emailRedirectTo: config.auth.redirectUrl,
      },
    });

    if (error) {
      setFormMsg(error.message);
      setLoading(false);
      return;
    }

    setFormMsg('Account created! Please check your email to verify your account.');
    setLoading(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSignup}>
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          minLength={3}
          maxLength={15}
          pattern="[a-z0-9]{3,15}"
          onChange={handleUsernameChange}
          onBlur={handleUsernameBlur}
          required
          autoComplete="off"
          className={
            usernameStatus === 'taken' || usernameStatus === 'invalid'
              ? 'border-red-500'
              : usernameStatus === 'available'
                ? 'border-green-500'
                : ''
          }
        />
        {usernameMsg && (
          <div
            className={`text-sm mt-1 ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-600' : 'text-green-600'}`}
          >
            {usernameMsg}
          </div>
        )}
      </div>

      {formMsg && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{formMsg}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || usernameStatus === 'taken' || usernameStatus === 'invalid'}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}
