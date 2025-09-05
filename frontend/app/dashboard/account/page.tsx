'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

const usernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-z0-9]+$/, 'Lowercase letters and numbers only'),
});
const emailSchema = z.object({
  email: z.string().email(),
});
const passwordSchema = z.object({
  password: z.string().min(6),
  newPassword: z.string().min(6),
});

type UsernameForm = z.infer<typeof usernameSchema>;
type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const { user } = useAuth();
  const supabase = createClient();

  // Username
  const usernameForm = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: user?.user_metadata?.username || '' },
  });
  // Email
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email || '' },
  });
  // Password
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', newPassword: '' },
  });

  // Username change handler
  async function onUsernameSubmit(data: UsernameForm) {
    // Check uniqueness
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('username', data.username)
      .neq('id', user?.id)
      .maybeSingle();
    if (exists) {
      usernameForm.setError('username', { message: 'Username is already taken' });
      return;
    }
    // Update in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ username: data.username })
      .eq('id', user?.id);
    if (error) {
      toast.error('Failed to update username', {
        description: error.message,
      });
      return;
    }
    // Update user_metadata
    await supabase.auth.updateUser({ data: { username: data.username } });
    toast.success('Username updated!');
  }

  // Email change handler
  async function onEmailSubmit(data: EmailForm) {
    const { error } = await supabase.auth.updateUser({ email: data.email });
    if (error) {
      toast.error('Failed to update email', {
        description: error.message,
      });
      return;
    }
    toast.success('Email update requested! Check your inbox to confirm.');
  }

  // Password change handler
  async function onPasswordSubmit(data: PasswordForm) {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) {
      toast.error('Failed to update password', {
        description: error.message,
      });
      return;
    }
    toast.success('Password updated!');
    passwordForm.reset();
  }

  if (!user) return <div className="p-8">Not signed in.</div>;

  return (
    <div className="max-w-2xl mx-auto flex-1 space-y-6 p-4 md:p-8 pt-6">
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Change Username</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-4 items-end"
            onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...usernameForm.register('username')} autoComplete="off" />
              {usernameForm.formState.errors.username && (
                <span className="text-xs text-red-600">
                  {usernameForm.formState.errors.username.message}
                </span>
              )}
            </div>
            <Button type="submit">Update</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4 items-end" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...emailForm.register('email')} autoComplete="off" />
              {emailForm.formState.errors.email && (
                <span className="text-xs text-red-600">
                  {emailForm.formState.errors.email.message}
                </span>
              )}
            </div>
            <Button type="submit">Update</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col md:flex-row gap-4 items-end"
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="password">Current Password</Label>
              <Input
                id="password"
                type="password"
                {...passwordForm.register('password')}
                autoComplete="off"
              />
              {passwordForm.formState.errors.password && (
                <span className="text-xs text-red-600">
                  {passwordForm.formState.errors.password.message}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register('newPassword')}
                autoComplete="off"
              />
              {passwordForm.formState.errors.newPassword && (
                <span className="text-xs text-red-600">
                  {passwordForm.formState.errors.newPassword.message}
                </span>
              )}
            </div>
            <Button type="submit">Update</Button>
          </form>
        </CardContent>
      </Card>
      <Separator />
      <div className="text-xs text-muted-foreground">
        All changes are saved securely. You may need to re-login after changing your email or
        password.
      </div>
    </div>
  );
}
