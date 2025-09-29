import { vi } from 'vitest';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({ value: 'mock-cookie' })
  })
}));

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    })
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: 'new-trade-id' }],
        error: null
      })
    })
  })
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue(mockSupabase)
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock fetch for API tests
global.fetch = vi.fn();

// Setup and teardown
beforeAll(() => {
  // Set up test environment
  vi.clearAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as any).mockClear();
});

afterAll(() => {
  // Clean up
  vi.restoreAllMocks();
});

// Export mock for use in tests
export { mockSupabase };

