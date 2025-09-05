'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { prefersReducedMotion } from '@/lib/accessibility';

interface AccessibleChartProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  reducedMotion?: boolean;
  loading?: boolean;
  error?: string | null;
}

export const AccessibleChart = forwardRef<HTMLDivElement, AccessibleChartProps>(
  ({ 
    children, 
    title, 
    description, 
    className, 
    reducedMotion = true,
    loading = false,
    error = null,
    ...props 
  }, ref) => {
    const shouldReduceMotion = reducedMotion && prefersReducedMotion();
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          'rounded-lg border',
          'bg-background',
          'p-4',
          // Reduced motion styles
          shouldReduceMotion && [
            'transition-none',
            'animate-none',
          ],
          className
        )}
        {...props}
      >
        {/* Chart Header */}
        {(title || description) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive text-center">
              <p className="font-medium">Error loading chart</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Chart Content */}
        {!loading && !error && (
          <div
            className={cn(
              'w-full',
              // Reduced motion for chart animations
              shouldReduceMotion && [
                '[&_*]:transition-none',
                '[&_*]:animate-none',
                '[&_*]:duration-0',
              ]
            )}
          >
            {children}
          </div>
        )}

        {/* Accessibility Announcements */}
        {title && (
          <div className="sr-only" aria-live="polite">
            Chart: {title}
            {description && ` - ${description}`}
          </div>
        )}
      </div>
    );
  }
);

AccessibleChart.displayName = 'AccessibleChart';

// Enhanced ResponsiveContainer with reduced motion support
interface AccessibleResponsiveContainerProps {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  aspect?: number;
  className?: string;
  reducedMotion?: boolean;
}

export const AccessibleResponsiveContainer: React.FC<AccessibleResponsiveContainerProps> = ({
  children,
  width = '100%',
  height = 400,
  aspect,
  className,
  reducedMotion = true,
}) => {
  const shouldReduceMotion = reducedMotion && prefersReducedMotion();
  
  return (
    <div
      className={cn(
        'relative w-full',
        // Reduced motion styles
        shouldReduceMotion && [
          'transition-none',
          'animate-none',
        ],
        className
      )}
      style={{
        width,
        height,
        aspectRatio: aspect,
      }}
    >
      {children}
    </div>
  );
};
