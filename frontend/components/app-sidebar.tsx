'use client';

import * as React from 'react';
import {
  GalleryVerticalEnd,
  BarChart3,
  TrendingUp,
  Home,
  Calculator,
  Target,
  Settings,
  Calendar,
  Shield,
  Merge,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from "@/providers/auth-provider";

const data = {
  teams: [
    {
      name: 'Trading Journal',
      logo: GalleryVerticalEnd,
      plan: 'Pro',
    },
  ],
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      isActive: true,
    },
    {
      title: 'Trades',
      url: '/dashboard/trades',
      icon: TrendingUp,
      items: [
        {
          title: 'View Trades',
          url: '/dashboard/trades',
        },
        {
          title: 'Add Trade',
          url: '/dashboard/add-trade',
        },
        {
          title: 'Import Hub',
          url: '/dashboard/import',
        },
        {
          title: 'Manual Entry',
          url: '/dashboard/import/manual',
        },
      ],
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: BarChart3,
      items: [
        {
          title: 'Performance',
          url: '/dashboard/analytics',
        },
        {
          title: 'P&L Calendar',
          url: '/dashboard/analytics/calendar',
        },
        {
          title: 'Reports',
          url: '/dashboard/reports',
        },
      ],
    },
    {
      title: 'Market Scanner',
      url: '/dashboard/scanner',
      icon: Target,
    },
    {
      title: 'Trending Tickers',
      url: '/dashboard/trending-tickers',
      icon: TrendingUp,
    },
    {
      title: 'Tax Center',
      url: '/dashboard/tax-center',
      icon: Calculator,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
    {
      title: 'Admin',
      url: '/admin',
      icon: Shield,
      items: [
        {
          title: 'Merge Instruments',
          url: '/admin/instruments/merge',
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const [dbUser, setDbUser] = useState<{ username: string; email: string; avatar?: string } | null>(
    null,
  );
  const supabase = createClient();

  React.useEffect(() => {
    async function fetchDbUser() {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (data) setDbUser({ ...(data as any), email: user.email || '' });
      }
    }
    fetchDbUser();
  }, [user]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: dbUser?.username || user?.user_metadata?.username || '-',
            email: dbUser?.email || user?.email || '-',
            avatar: '/placeholder-user.jpg',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
