/**
 * UI Constants - Central design tokens for consistent spacing, colors, and styling
 * Use these gradually throughout the app for consistency
 */

// Spacing scale (based on Tailwind's 4px base unit)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

// Border radius
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// Shadow tokens
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Color tokens (semantic, not specific colors)
export const colors = {
  // Primary brand colors
  primary: {
    50: 'hsl(var(--primary-50))',
    100: 'hsl(var(--primary-100))',
    500: 'hsl(var(--primary-500))',
    600: 'hsl(var(--primary-600))',
    900: 'hsl(var(--primary-900))',
  },
  
  // Semantic colors
  success: {
    50: 'hsl(var(--success-50))',
    500: 'hsl(var(--success-500))',
    600: 'hsl(var(--success-600))',
  },
  
  warning: {
    50: 'hsl(var(--warning-50))',
    500: 'hsl(var(--warning-500))',
    600: 'hsl(var(--warning-600))',
  },
  
  error: {
    50: 'hsl(var(--error-50))',
    500: 'hsl(var(--error-500))',
    600: 'hsl(var(--error-600))',
  },
  
  // Neutral colors
  neutral: {
    50: 'hsl(var(--neutral-50))',
    100: 'hsl(var(--neutral-100))',
    200: 'hsl(var(--neutral-200))',
    300: 'hsl(var(--neutral-300))',
    400: 'hsl(var(--neutral-400))',
    500: 'hsl(var(--neutral-500))',
    600: 'hsl(var(--neutral-600))',
    700: 'hsl(var(--neutral-700))',
    800: 'hsl(var(--neutral-800))',
    900: 'hsl(var(--neutral-900))',
  },
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Breakpoints (matching Tailwind defaults)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation durations
export const durations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms',
} as const;

// Animation easings
export const easings = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Export all constants as a single object for easy destructuring
export const ui = {
  spacing,
  radius,
  shadows,
  colors,
  zIndex,
  breakpoints,
  durations,
  easings,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Shadow = keyof typeof shadows;
export type ZIndex = keyof typeof zIndex;
