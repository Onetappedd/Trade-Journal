'use client';

import { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { UserPlus, UserMinus, Shield, Users, Mail } from 'lucide-react';

import type { Database } from '@/lib/supabase/types';

type AdminUser = Database['public']['Tables']['admin_users']['Row'];
type UserProfile = Database['public']['Views']['user_subscription_status']['Row'];

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdmin, setRemovingAdmin] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load admin users
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;
      setAdminUsers(adminData || []);

      // Load all users (admin only)
      const { data: usersData, error: usersError } = await supabase
        .from('user_subscription_status')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setAllUsers(usersData || []);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  async function addAdminUser() {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setAddingAdmin(true);
      
      const { error } = await supabase.rpc('add_admin_user', {
        admin_email: newAdminEmail.trim().toLowerCase()
      } as any);

      if (error) throw error;

      toast.success(`Admin access granted to ${newAdminEmail}`);
      setNewAdminEmail('');
      loadData(); // Reload data

    } catch (error) {
      console.error('Error adding admin user:', error);
      toast.error('Failed to add admin user');
    } finally {
      setAddingAdmin(false);
    }
  }

  async function removeAdminUser(email: string) {
    try {
      setRemovingAdmin(email);
      
      const { error } = await supabase.rpc('remove_admin_user', {
        admin_email: email
      } as any);

      if (error) throw error;

      toast.success(`Admin access removed from ${email}`);
      loadData(); // Reload data

    } catch (error) {
      console.error('Error removing admin user:', error);
      toast.error('Failed to remove admin user');
    } finally {
      setRemovingAdmin(null);
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--pp-accent]"></div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin User Management</h1>
          <p className="text-[--pp-muted]">Manage admin access and user roles</p>
        </div>

        {/* Add Admin User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Admin User
            </CardTitle>
            <CardDescription>
              Grant admin access to a user by email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={addAdminUser}
                disabled={addingAdmin || !newAdminEmail.trim()}
              >
                {addingAdmin ? 'Adding...' : 'Add Admin'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Admin Users ({adminUsers.length})
            </CardTitle>
            <CardDescription>
              Users with admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminUsers.length === 0 ? (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  No admin users found. Add the first admin user above.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="default">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAdminUser(user.email)}
                          disabled={removingAdmin === user.email}
                        >
                          {removingAdmin === user.email ? 'Removing...' : 'Remove Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* All Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users ({allUsers.length})
            </CardTitle>
            <CardDescription>
              Overview of all user accounts and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Trial Ends</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : user.role === 'pro' ? 'secondary' : 'outline'}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          user.subscription_status === 'active' ? 'default' :
                          user.subscription_status === 'trial' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          user.access_status === 'trial_active' ? 'secondary' :
                          user.access_status === 'subscription_active' ? 'default' :
                          'destructive'
                        }
                      >
                        {user.access_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.trial_ends_at 
                        ? new Date(user.trial_ends_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
