# AppShell Layout System

## Overview

The AppShell provides a consistent layout wrapper for authenticated pages with:
- **Header**: App name/logo, search placeholder, and theme toggle
- **Sidebar**: Navigation links to main sections (collapsible on mobile)
- **Main Content**: Page content wrapped in the shell

## How It Works

### 1. Automatic Wrapping
All pages under `/dashboard/*` automatically use the AppShell through the dashboard layout:

```tsx
// app/dashboard/layout.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
```

### 2. Navigation Structure
The sidebar includes these main sections:
- **Dashboard** (`/dashboard`) - Main overview
- **Trades** (`/dashboard/trades`) - Trade management
- **Analytics** (`/dashboard/analytics`) - Charts and analysis
- **Import** (`/dashboard/import`) - Data import tools
- **Portfolio** (`/dashboard/portfolio`) - Portfolio management

### 3. Features

#### Header
- **Logo**: Clickable "Riskr" text that links to dashboard
- **Search**: Placeholder input (functionality to be added later)
- **Theme Toggle**: Light/dark mode switch with smooth transitions

#### Sidebar
- **Desktop**: Fixed 256px width sidebar with navigation
- **Mobile**: Collapsible overlay sidebar with hamburger menu
- **Active States**: Current page highlighted with primary colors
- **Icons**: Lucide React icons for each navigation item

#### Responsive Design
- **Mobile First**: Sidebar collapses to overlay on small screens
- **Breakpoints**: Uses Tailwind's responsive utilities
- **Touch Friendly**: Mobile-optimized interactions

## Usage Examples

### Adding New Pages
To add a new page that uses the AppShell:

1. **Place it under `/dashboard/`** - It automatically gets the AppShell
2. **Or create a custom layout** for other sections:

```tsx
// app/other-section/layout.tsx
import { AppShell } from '@/components/layout/AppShell';

export default function OtherSectionLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
```

### Customizing Navigation
To modify the sidebar navigation, edit the `navigation` array in `AppShell.tsx`:

```tsx
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Trades', href: '/dashboard/trades', icon: FileText },
  // Add your custom navigation items here
  { name: 'Custom', href: '/dashboard/custom', icon: CustomIcon },
];
```

### Theme Integration
The AppShell automatically integrates with your existing `next-themes` setup:
- Respects current theme settings
- Provides toggle button in header
- Smooth transitions between themes

## Technical Details

### Dependencies
- **UI Components**: Uses existing shadcn/ui components (Button, Input)
- **Icons**: Lucide React icons
- **Theme**: Integrates with `next-themes`
- **Routing**: Next.js App Router with `usePathname`

### Styling
- **Tailwind CSS**: Consistent with your existing design system
- **CSS Variables**: Uses your theme CSS custom properties
- **Responsive**: Mobile-first responsive design
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Performance
- **Client Component**: Uses `'use client'` for interactivity
- **State Management**: Local state for sidebar open/close
- **No External Dependencies**: Only uses existing project libraries

## Migration Notes

### What Changed
- **Dashboard Layout**: Now wraps all dashboard pages with AppShell
- **Page Content**: Existing pages render inside the shell without changes
- **Navigation**: New consistent sidebar navigation
- **Theme Toggle**: Added to header (replaces any existing theme controls)

### What Stayed the Same
- **Route Paths**: All existing URLs work unchanged
- **Page Components**: No changes needed to individual page components
- **Styling**: Existing Tailwind classes and design tokens
- **Functionality**: All existing features work as before

### Testing
1. **Navigate to `/dashboard`** - Should show AppShell with sidebar
2. **Check mobile view** - Sidebar should collapse to hamburger menu
3. **Test theme toggle** - Should switch between light/dark modes
4. **Verify navigation** - All sidebar links should work correctly
5. **Check existing pages** - Content should render inside the shell

## Future Enhancements

### Planned Features
- **Search Functionality**: Implement actual search in header
- **User Menu**: Add user profile dropdown in header
- **Notifications**: Add notification bell with dropdown
- **Breadcrumbs**: Show current page location
- **Custom Themes**: Allow users to customize sidebar appearance

### Customization Options
- **Sidebar Width**: Configurable sidebar width
- **Color Schemes**: Custom color themes
- **Navigation Groups**: Group navigation items by category
- **Quick Actions**: Add quick action buttons to header
- **Footer**: Optional footer section

## Troubleshooting

### Common Issues

#### Sidebar Not Showing
- Check if page is under `/dashboard/*` route
- Verify dashboard layout is properly imported
- Check browser console for errors

#### Theme Toggle Not Working
- Ensure `next-themes` is properly configured
- Check if `ThemeProvider` wraps the app
- Verify CSS custom properties are defined

#### Mobile Menu Issues
- Check if `useState` is properly imported
- Verify mobile breakpoint classes
- Test on actual mobile devices

#### Styling Conflicts
- Check for conflicting Tailwind classes
- Verify CSS custom properties are loaded
- Ensure proper CSS cascade order

### Debug Mode
To enable debug logging, add this to your environment:

```bash
NEXT_PUBLIC_DEBUG_APPSHELL=true
```

This will log navigation state changes and theme updates to the console.
