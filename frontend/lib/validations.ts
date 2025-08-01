import { z } from "zod"

// Validator for a single email string
export const emailValidation = z.string().email({ message: "Please enter a valid email address." })

// Validator for a single password string
export const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character.")

// Schema for the login form
export const loginFormSchema = z.object({
  email: emailValidation,
  password: z.string().min(1, "Password is required."), // Less strict for login
  remember: z.boolean().default(false),
})

// Schema for the signup form
export const signupFormSchema = z
  .object({
    displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }),
    email: emailValidation,
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

// Schema for the password reset form
export const resetPasswordSchema = z.object({
  email: emailValidation,
})

export const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

export type TradeFormData = z.infer<typeof tradeSchema>
