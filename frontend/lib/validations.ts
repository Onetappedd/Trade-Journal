import { z } from "zod"

export const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  asset_type: z.enum(["stock", "option", "crypto", "forex"]),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  entry_price: z.number().min(0.01, "Entry price must be greater than 0"),
  exit_price: z.number().optional(),
  trade_date: z.string(),
  exit_date: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fees: z.number().optional(),
  // Option-specific fields
  strike_price: z.number().optional(),
  expiration_date: z.string().optional(),
  option_type: z.enum(["call", "put"]).optional(),
  // Additional fields
  strategy: z.string().optional(),
  setup: z.string().optional(),
})

export type TradeFormData = z.infer<typeof tradeSchema>

export const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal("")),
})

export type ProfileFormData = z.infer<typeof profileSchema>

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

// Add the missing passwordSchema
export const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>
