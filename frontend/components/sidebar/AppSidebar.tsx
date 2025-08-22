'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  TrendingUp,
  BarChart3,
  Activity,
  Calculator,
  Settings,
  Plus,
  Upload,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Trades', href: '/dashboard/trades', icon: TrendingUp },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Trending Tickers', href: '/dashboard/trending-tickers', icon: Activity },
  { name: 'Tax Center', href: '/dashboard/tax-center', icon: Calculator },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const quickActions = [
  { name: 'Add Trade', href: '/dashboard/add-trade', icon: Plus },
  { name: 'Import Trades', href: '/dashboard/import-trades', icon: Upload },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-neutral-900 text-neutral-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'rounded-tr-2xl rounded-br-2xl shadow-2xl',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Trade Journal</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
                  )}
                  onClick={onClose}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
                    )}
                    onClick={onClose}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback className="bg-blue-600 text-white">JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">John Doe</p>
              <p className="text-xs text-neutral-400 truncate">john@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
