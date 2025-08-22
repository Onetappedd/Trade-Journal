import { z } from 'zod';

// Trade validation schemas
export const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  asset_type: z.enum(['stock', 'option', 'crypto', 'futures', 'forex']),
  side: z.enum(['buy', 'sell']),
  quantity: z.coerce.number().min(0.000001, 'Quantity must be positive'),
  entry_price: z.coerce.number().min(0, 'Entry price must be non-negative'),
  exit_price: z.coerce.number().optional(),
  entry_date: z.string(),
  exit_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  strike_price: z.coerce.number().optional(),
  expiry_date: z.string().optional(),
  option_type: z.enum(['call', 'put']).optional(),
});

export type TradeFormData = z.infer<typeof tradeSchema>;

// Authentication validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Profile validation schemas
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  avatar_url: z.string().url().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Filter validation schemas
export const tradeFiltersSchema = z.object({
  symbol: z.string().optional(),
  asset_type: z.enum(['stock', 'option', 'crypto', 'futures', 'forex']).optional(),
  side: z.enum(['buy', 'sell']).optional(),
  status: z.enum(['open', 'closed']).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type TradeFiltersData = z.infer<typeof tradeFiltersSchema>;
