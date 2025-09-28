# Consistent Error Handling System

## Overview
A comprehensive error handling system that provides consistent failure behavior across the entire application, with standardized JSON error shapes, shared toast components, and proper error boundaries with loading skeletons.

## Key Features

### 🎯 **Standardized Error Responses**
- **Consistent JSON Shape**: All API routes return `{ error: { code, message } }`
- **Proper HTTP Status**: Error codes mapped to appropriate status codes
- **Error Categorization**: Predefined error codes for different scenarios
- **User-Friendly Messages**: Clear, actionable error messages

### 🍞 **Toast Notifications**
- **Shared Toast Component**: Centralized error display system
- **Multiple Types**: Success, error, warning, and info toasts
- **Auto-dismiss**: Configurable duration with auto-removal
- **Action Buttons**: Retry and recovery options in toasts

### 🛡️ **Error Boundaries**
- **React Error Boundaries**: Catch JavaScript errors in component tree
- **Fallback UI**: Friendly error pages with recovery options
- **Error Reporting**: Automatic error logging and reporting
- **Recovery Paths**: Retry, reload, and navigation options

### ⏳ **Loading Skeletons**
- **Visual Feedback**: Skeleton components during data loading
- **Page-specific Skeletons**: Tailored skeletons for different layouts
- **Smooth Transitions**: Animated loading states
- **Better UX**: No more blank screens during loading

## Architecture

### 1. **API Error Types** (`src/types/api.ts`)

**Standardized Error Shape:**
```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}
```

**Error Codes:**
```typescript
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  // ... more codes
};
```

### 2. **Toast System** (`src/components/ui/toast.tsx`)

**Toast Provider:**
```typescript
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Add toast with auto-removal
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
```

**Toast Types:**
- **Success**: Green with checkmark icon
- **Error**: Red with alert icon
- **Warning**: Yellow with warning icon
- **Info**: Blue with info icon

### 3. **useApi Hook** (`src/hooks/useApi.ts`)

**Features:**
- Standardized error handling
- Loading state management
- Toast notifications
- Success/error callbacks
- Automatic error parsing

**Usage:**
```typescript
const { data, loading, error, execute } = useApi({
  onSuccess: (data) => {
    addToast({ type: 'success', title: 'Success', message: 'Data loaded' });
  },
  onError: (error) => {
    addToast({ type: 'error', title: 'Error', message: error.message });
  }
});

// Execute API call
await execute('/api/kpi/summary');
```

### 4. **Error Boundaries** (`src/components/error/ErrorBoundary.tsx`)

**Error Boundary Class:**
```typescript
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error and report to monitoring service
    this.reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={this.resetErrorBoundary} />;
    }
    return this.props.children;
  }
}
```

**Fallback UI:**
- Friendly error message
- Error ID for tracking
- Retry button
- Reload page option
- Go home navigation
- Development error details

### 5. **Loading Skeletons** (`src/components/ui/skeleton.tsx`)

**Skeleton Components:**
- **Base Skeleton**: Animated loading placeholder
- **Card Skeleton**: For card layouts
- **Table Skeleton**: For table layouts
- **Dashboard Skeleton**: For dashboard layouts
- **Form Skeleton**: For form layouts

**Usage:**
```typescript
// Basic skeleton
<Skeleton className="h-4 w-32" />

// Card skeleton
<CardSkeleton />

// Table skeleton
<TableSkeleton rows={5} columns={4} />
```

## API Route Implementation

### **Standardized Error Responses**

**Before:**
```typescript
// ❌ Inconsistent error responses
return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
return NextResponse.json({ message: 'Not found' }, { status: 404 });
```

**After:**
```typescript
// ✅ Standardized error responses
return NextResponse.json(
  createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch data'),
  { status: 500 }
);

return NextResponse.json(
  createApiError(ERROR_CODES.NOT_FOUND, 'Resource not found'),
  { status: 404 }
);
```

### **Success Responses**

**Before:**
```typescript
// ❌ Inconsistent success responses
return NextResponse.json(data);
return NextResponse.json({ result: data });
```

**After:**
```typescript
// ✅ Standardized success responses
return NextResponse.json(createApiSuccess(data));
```

## Error Handling Flow

### 1. **API Error Flow**
```
API Route → Error Occurs → createApiError() → Standardized Response → useApi Hook → Toast Notification
```

### 2. **Component Error Flow**
```
Component → JavaScript Error → Error Boundary → Fallback UI → Recovery Options
```

### 3. **Loading Flow**
```
Component → Loading State → Skeleton Component → Data Loaded → Content Displayed
```

## Error Categories

### **Authentication Errors**
- `UNAUTHORIZED`: No valid token
- `FORBIDDEN`: Insufficient permissions
- `TOKEN_EXPIRED`: Token has expired

### **Validation Errors**
- `VALIDATION_ERROR`: Input validation failed
- `INVALID_INPUT`: Invalid request data
- `MISSING_REQUIRED_FIELD`: Required field missing

### **Resource Errors**
- `NOT_FOUND`: Resource not found
- `RESOURCE_CONFLICT`: Resource conflict
- `RESOURCE_LIMIT_EXCEEDED`: Usage limit exceeded

### **System Errors**
- `INTERNAL_SERVER_ERROR`: Server error
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: External service failed

## Testing

### **E2E Tests**
- **API Error Handling**: Verifies error responses and toast notifications
- **Error Boundaries**: Tests JavaScript error catching
- **Loading States**: Validates skeleton components
- **Recovery Paths**: Tests retry and recovery options

### **Error Simulation**
- **500 Errors**: Server error simulation
- **Network Errors**: Connection failure simulation
- **Validation Errors**: Input validation simulation
- **Auth Errors**: Authentication failure simulation

## Usage Examples

### **API Route Error Handling**
```typescript
export async function GET(request: NextRequest) {
  try {
    // API logic
    const data = await fetchData();
    return NextResponse.json(createApiSuccess(data));
  } catch (error: any) {
    return NextResponse.json(
      createApiError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Failed to fetch data', error.message),
      { status: 500 }
    );
  }
}
```

### **Component Error Handling**
```typescript
function MyComponent() {
  const { data, loading, error, execute } = useApi({
    onSuccess: (data) => {
      addToast({ type: 'success', title: 'Success', message: 'Data loaded' });
    },
    onError: (error) => {
      addToast({ type: 'error', title: 'Error', message: error.message });
    }
  });

  if (loading) return <Skeleton className="h-32 w-full" />;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data}</div>;
}
```

### **Error Boundary Usage**
```typescript
// Wrap components with error boundary
<ErrorBoundary fallback={<CustomErrorFallback />}>
  <MyComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(MyComponent);
```

## Performance Optimizations

### **Error Handling**
- **Error Caching**: Prevent duplicate error processing
- **Toast Limits**: Limit number of simultaneous toasts
- **Error Reporting**: Batch error reports for efficiency
- **Recovery Options**: Quick retry mechanisms

### **Loading States**
- **Skeleton Animation**: Smooth loading transitions
- **Progressive Loading**: Load critical content first
- **Error Recovery**: Fast error state recovery
- **User Feedback**: Clear loading indicators

## Monitoring

### **Error Tracking**
- **Error Frequency**: Track error occurrence rates
- **Error Types**: Categorize errors by type
- **Recovery Success**: Monitor retry success rates
- **User Impact**: Measure error impact on users

### **Performance Metrics**
- **Loading Times**: Track skeleton display duration
- **Error Recovery**: Measure recovery time
- **Toast Dismissal**: Track user interaction with toasts
- **Boundary Triggers**: Monitor error boundary usage

## Troubleshooting

### **Common Issues**
1. **Toasts not showing**: Check ToastProvider setup
2. **Error boundaries not catching**: Verify component tree structure
3. **Skeletons not displaying**: Check loading state management
4. **API errors not standardized**: Verify error response format

### **Debug Steps**
1. Check error logs in console
2. Verify error boundary setup
3. Test API error responses
4. Validate toast notifications

---

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Wrap App with Providers**
   ```typescript
   <ToastProvider>
     <ErrorBoundary>
       <App />
     </ErrorBoundary>
   </ToastProvider>
   ```

3. **Use useApi Hook**
   ```typescript
   const { data, loading, error, execute } = useApi();
   ```

4. **Test Error Handling**
   - Navigate to `/test-errors`
   - Test API error scenarios
   - Verify error boundaries
   - Check toast notifications

## Support

For issues or questions:
- Check the troubleshooting guide
- Review error logs
- Contact support team
- Submit bug reports

---

*Last updated: 2025-09-27*
*Version: 1.0.0*

