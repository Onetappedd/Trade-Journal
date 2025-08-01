import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const passwordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  date: z.date(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const profileSchema = z.object({
  display_name: z.string().min(2, "Display name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type TradeFormData = z.infer<typeof tradeSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
