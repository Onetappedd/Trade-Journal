'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/accessibility';

// Enhanced Table components with better accessibility

export const AccessibleTable = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        'w-full caption-bottom text-sm',
        'border-collapse',
        className
      )}
      {...props}
    />
  </div>
));
AccessibleTable.displayName = 'AccessibleTable';

export const AccessibleTableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      'bg-muted/50',
      'border-b border-border',
      className
    )}
    {...props}
  />
));
AccessibleTableHeader.displayName = 'AccessibleTableHeader';

export const AccessibleTableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      'divide-y divide-border',
      'bg-background',
      className
    )}
    {...props}
  />
));
AccessibleTableBody.displayName = 'AccessibleTableBody';

export const AccessibleTableFooter = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'bg-muted/50',
      'border-t border-border',
      'font-medium',
      className
    )}
    {...props}
  />
));
AccessibleTableFooter.displayName = 'AccessibleTableFooter';

export const AccessibleTableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => {
  const shouldReduceMotion = prefersReducedMotion();
  
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border/50',
        'transition-colors',
        'hover:bg-muted/50',
        'focus-within:bg-muted/50',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-offset-background',
        // Reduced motion
        shouldReduceMotion && 'transition-none',
        className
      )}
      tabIndex={0}
      {...props}
    />
  );
});
AccessibleTableRow.displayName = 'AccessibleTableRow';

export const AccessibleTableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle',
      'font-medium text-muted-foreground',
      'border-b border-border/50',
      'bg-muted/30',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
AccessibleTableHead.displayName = 'AccessibleTableHead';

export const AccessibleTableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 align-middle',
      'text-foreground',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
AccessibleTableCell.displayName = 'AccessibleTableCell';

export const AccessibleTableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      'mt-4 text-sm text-muted-foreground',
      'text-center',
      className
    )}
    {...props}
  />
));
AccessibleTableCaption.displayName = 'AccessibleTableCaption';
