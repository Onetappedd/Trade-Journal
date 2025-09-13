'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { prefersReducedMotion } from '@/lib/accessibility';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  focusRing?: boolean;
  reducedMotion?: boolean;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    focusRing = true, 
    reducedMotion = true,
    children, 
    ...props 
  }, ref) => {
    const shouldReduceMotion = reducedMotion && prefersReducedMotion();
    
    return (
      <Button
        ref={ref}
        className={cn(
          // Base styles
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
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
