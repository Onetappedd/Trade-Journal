'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

export function ProfileSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription>
          Update your personal information and display preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, GIF or PNG. 1MB max.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" placeholder="John" />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" placeholder="Doe" />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="johndoe" />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" placeholder="Tell us about yourself" />
        </div>

        <Button>Save Changes</Button>
      </CardContent>
    </Card>
  );
}