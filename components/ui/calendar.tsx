// 'use client' is required because react-day-picker is a client component.

'use client';

import * as React from 'react';

import { DayPicker } from 'react-day-picker';

import enUS from 'date-fns/locale/en-US';

// Minimal className joiner so we don't depend on "@/lib/utils"
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendar component that guarantees a valid date-fns locale.
 * If no locale prop is passed, it falls back to enUS (wired to our shim/alias).
 */
export function Calendar({
  className,
  locale,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      locale={locale ?? enUS}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

// Export default too, in case some files import the default.
export default Calendar;
