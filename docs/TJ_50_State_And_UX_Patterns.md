# Trade-Journal State Management & UX Patterns

**Document Version**: 1.0  
**Last Updated**: 2025-01-18

---

## 1. State Management Overview

### State Layers

1. **Server State** (API data): React Query + SWR
2. **Global Client State** (UI state): Zustand + React Context
3. **Local Component State**: React useState/useReducer
4. **Form State**: React Hook Form + Zod
5. **URL State**: Next.js router (query params, dynamic routes)

---

## 2. Server State Management

### React Query (`@tanstack/react-query`)

**Setup** (`app/providers.tsx`):
```typescript
const queryClient = new QueryClient()

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Usage Pattern**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['trades', userId],
  queryFn: () => fetch('/api/trades').then(res => res.json()),
  staleTime: 60000, // 1 minute
})
```

**Cache Invalidation**:
```typescript
// After creating/updating trade
queryClient.invalidateQueries(['trades'])
```

**Advantages**:
- Built-in caching
- Automatic background refetching
- Optimistic updates
- DevTools integration

### SWR (Legacy)

**Used in**: Some older components (`useUserTrades.ts`, etc.)

**Pattern**:
```typescript
const { data, error, mutate } = useSWR('/api/trades', fetcher)
```

**Migration Path**: Gradually replacing with React Query

---

## 3. Global Client State

### Zustand Stores

**Analytics Filters Store** (`store/analytics-filters.ts`):
```typescript
export const useAnalyticsFilters = create((set) => ({
  timeframe: '3M',
  strategy: 'all',
  setTimeframe: (t) => set({ timeframe: t }),
  setStrategy: (s) => set({ strategy: s }),
}))
```

**Usage**:
```typescript
const { timeframe, setTimeframe } = useAnalyticsFilters()
```

**Persistence**: State lost on page refresh (could add persist middleware)

### React Context

**AuthProvider** (`providers/auth-provider.tsx`):
- Provides: `user`, `session`, `loading`, `supabase`
- Scope: Global (wraps entire app)

**ThemeProvider** (`components/theme-provider.tsx`):
- Provides: `theme`, `setTheme`
- Powered by `next-themes`
- Persists: localStorage

---

## 4. Form State Management

### React Hook Form + Zod

**Pattern**:
```typescript
const formSchema = z.object({
  symbol: z.string().min(1),
  quantity: z.number().positive(),
  price: z.number().positive(),
})

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { symbol: '', quantity: 0, price: 0 }
})

const onSubmit = (data) => {
  // data is typed and validated
}
```

**Used in**: Login, Signup, Add Trade, Settings forms

**Advantages**:
- Type-safe
- Automatic validation
- Error handling
- Optimized re-renders

---

## 5. Loading States

### Page-Level Loading

**Skeleton Loaders**:
- Used in: Dashboard, Analytics, Trades pages
- Pattern: Check `isLoading` state, render skeleton instead of real content

**Next.js `loading.tsx`**:
- File: `app/loading.tsx`, `app/trades/loading.tsx`
- Automatic: Shows while route segment loads

### Component-Level Loading

**Button Loading States**:
```typescript
<Button disabled={isSubmitting}>
  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit'}
</Button>
```

**Inline Spinners**:
```typescript
{isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
```

---

## 6. Error Handling

### API Error Responses

**Standard Format**:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": "Optional detailed error"
}
```

**Error Codes** (`src/types/api.ts`):
- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `INTERNAL_SERVER_ERROR`

### Client-Side Error Display

**Toast Notifications** (`sonner` or `use-toast`):
```typescript
import { toast } from 'sonner'

toast.error('Failed to load trades', {
  description: error.message
})
```

**Error Boundaries** (`app/error.tsx`):
- Catches unexpected errors
- Shows fallback UI
- Logs to Sentry (if configured)

**Inline Error Messages**:
- Form field errors
- API error banners (with retry button)

---

## 7. Theming & Dark Mode

### Implementation

**Library**: `next-themes`

**Provider** (`components/theme-provider.tsx`):
```typescript
<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

**Theme Toggle** (`components/theme-toggle.tsx`):
```typescript
const { theme, setTheme } = useTheme()
```

**CSS Variables** (`app/globals.css`):
- Light mode: `:root` CSS vars
- Dark mode: `.dark` CSS vars
- Tailwind: Uses `dark:` prefix

---

## 8. Layout Patterns

### Conditional Layout

**Component**: `components/conditional-layout.tsx`

**Logic**:
- If route is public (landing, login, signup): No AppShell
- If route is protected (dashboard, trades, etc.): Wrap with AppShell

### AppShell

**Components**:
- `components/layout/AppShell.tsx`
- `components/app-sidebar.tsx`

**Structure**:
- Sidebar (left): Navigation menu
- Header (top): Logo, user menu, theme toggle
- Main content area: Page content

**Responsive**:
- Desktop: Sidebar always visible
- Mobile: Sidebar collapses to drawer/hamburger

---

## 9. UX Patterns

### Empty States

**Component**: `components/empty-state.tsx`

**Usage**:
```typescript
<EmptyState
  icon={BarChart3}
  title="No trades yet"
  description="Import your first trade to get started"
  actionLabel="Import Trades"
  actionHref="/import"
/>
```

**Displayed When**:
- No trades exist
- No analytics data (< 10 trades)
- No broker connections

### Confirmation Dialogs

**Component**: `components/confirmation-dialog.tsx` or shadcn `AlertDialog`

**Pattern**:
```typescript
<AlertDialog>
  <AlertDialogTrigger>Delete Trade</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    <AlertDialogDescription>
      This action cannot be undone.
    </AlertDialogDescription>
    <AlertDialogAction onClick={handleDelete}>
      Delete
    </AlertDialogAction>
  </AlertDialogContent>
</AlertDialog>
```

**Used For**:
- Delete trade
- Delete account
- Disconnect broker
- Cancel subscription

### Toasts & Notifications

**Library**: `sonner` (primary) + `use-toast` (shadcn)

**Types**:
- `toast.success()`: Green checkmark
- `toast.error()`: Red X
- `toast.info()`: Blue info icon
- `toast.promise()`: For async operations

### Progress Indicators

**Import Progress**:
- Currently: Blocking (waits for entire import)
- TODO: Real-time progress bar (WebSocket/SSE)

**File Upload**:
- Drag-and-drop visual feedback
- File size/type validation messages

---

## 10. Accessibility (a11y)

### Keyboard Navigation

- All interactive elements accessible via Tab
- Enter/Space activates buttons
- Escape closes modals/drawers

### Screen Readers

- Semantic HTML (`<main>`, `<nav>`, `<header>`)
- ARIA labels on icons
- Form labels properly associated

### Focus Management

- Focus trapped in modals
- Focus restored after modal close
- Focus outlines visible (not removed)

---

## 11. Performance Patterns

### Code Splitting

- Dynamic imports for heavy components
- Next.js automatic route-based splitting

### Virtualization

- Used for large trade lists (>200 items)
- Libraries: `react-window`, `@tanstack/react-virtual`

### Debouncing

**Search Inputs**:
```typescript
const debouncedSearch = useDebounce(searchTerm, 300)
```

**File**: `hooks/use-debounce.ts`

### Memoization

- `useMemo` for expensive calculations
- `React.memo` for preventing unnecessary re-renders

---

**End of Document**

