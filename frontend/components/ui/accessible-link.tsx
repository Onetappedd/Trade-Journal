'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/accessibility';

interface AccessibleLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
  focusRing?: boolean;
  reducedMotion?: boolean;
  external?: boolean;
}

export const AccessibleLink = forwardRef<HTMLAnchorElement, AccessibleLinkProps>(
  ({ 
    href, 
    className, 
    focusRing = true, 
    reducedMotion = true,
    external = false,
    children, 
    ...props 
  }, ref) => {
    const shouldReduceMotion = reducedMotion && prefersReducedMotion();
    
    const linkProps = {
      ...props,
      ...(external && {
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${props['aria-label'] || 'Opens in new tab'} (opens in new tab)`
      })
    };
    
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(
          // Base styles
          'inline-flex items-center',
          className,
          // Focus ring styles
          focusRing && [
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-ring',
            'focus-visible:ring-offset-2',
            'focus-visible:ring-offset-background',
          ],
          // Reduced motion styles
          shouldReduceMotion && [
            'transition-none',
            'animate-none',
            'hover:transform-none',
          ]
        )}
        {...linkProps}
      >
        {children}
        {external && (
          <svg
            className="ml-1 h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </Link>
    );
  }
);

AccessibleLink.displayName = 'AccessibleLink';
