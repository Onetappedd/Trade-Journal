'use client';

import { ProfileSettings } from './ProfileSettings';
import { TradingSettings } from './TradingSettings';
import { NotificationSettings } from './NotificationSettings';
import { IntegrationSettings } from './IntegrationSettings';
import { BillingSettings } from './BillingSettings';
import type { SettingsSection } from '@/app/dashboard/settings/page';

interface SettingsContentProps {
  activeSection: SettingsSection;
}

export function SettingsContent({ activeSection }: SettingsContentProps) {
  switch (activeSection) {
    case 'profile':
      return <ProfileSettings />;
    case 'trading':
      return <TradingSettings />;
    case 'notifications':
      return <NotificationSettings />;
    case 'integrations':
      return <IntegrationSettings />;
    case 'billing':
      return <BillingSettings />;
    default:
      return <ProfileSettings />;
  }
}
