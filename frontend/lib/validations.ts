import { z } from "zod"

// Trade validation schema
export const tradeSchema = z
  .object({
    symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long").toUpperCase(),
    asset_type: z.enum(["stock", "option", "futures", "crypto"], {
      required_error: "Asset type is required",
    }),
    broker: z.enum(["webull", "robinhood", "schwab", "ibkr", "td", "other"], {
      required_error: "Broker is required",
    }),
    side: z.enum(["buy", "sell"], {
      required_error: "Side is required",
    }),
    quantity: z.number().int().positive("Quantity must be positive"),
    entry_price: z.number().positive("Entry price must be positive"),
    exit_price: z.number().positive("Exit price must be positive").optional(),
    entry_date: z.string().datetime("Invalid entry date"),
    exit_date: z.string().datetime("Invalid exit date").optional(),
    status: z.enum(["open", "closed"]).default("open"),
    notes: z.string().max(1000, "Notes too long").optional(),
    fees: z.number().min(0, "Fees cannot be negative").default(0),

    // Option specific fields
    strike_price: z.number().positive("Strike price must be positive").optional(),
    expiration_date: z.string().date("Invalid expiration date").optional(),
    option_type: z.enum(["call", "put"]).optional(),

    // Tags
    tag_ids: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      // If asset type is option, require option fields
      if (data.asset_type === "option") {
        return data.strike_price && data.expiration_date && data.option_type
      }
      return true
    },
    {
      message: "Options require strike price, expiration date, and option type",
      path: ["asset_type"],
    },
  )
  .refine(
    (data) => {
      // If status is closed, require exit price and date
      if (data.status === "closed") {
        return data.exit_price && data.exit_date
      }
      return true
    },
    {
      message: "Closed trades require exit price and date",
      path: ["status"],
    },
  )
  .refine(
    (data) => {
      // Exit date must be after entry date
      if (data.exit_date && data.entry_date) {
        return new Date(data.exit_date) > new Date(data.entry_date)
      }
      return true
    },
    {
      message: "Exit date must be after entry date",
      path: ["exit_date"],
    },
  )

// Profile validation schema
export const profileSchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(50, "Display name too long"),
  timezone: z.string().min(1, "Timezone is required"),
  default_broker: z.enum(["webull", "robinhood", "schwab", "ibkr", "td", "other"]),
  default_asset_type: z.enum(["stock", "option", "futures", "crypto"]),
  risk_tolerance: z.enum(["conservative", "moderate", "aggressive"]),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  trade_alerts: z.boolean(),
  weekly_reports: z.boolean(),
})

// Tag validation schema
export const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30, "Tag name too long"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
})

// Watchlist validation schema
export const watchlistSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long").toUpperCase(),
  name: z.string().max(100, "Name too long").optional(),
  sector: z.string().max(50, "Sector too long").optional(),
})

// Alert validation schema
export const alertSchema = z
  .object({
    symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long").toUpperCase(),
    alert_type: z.enum(["price_above", "price_below", "volume_spike", "news"]),
    target_value: z.number().positive("Target value must be positive").optional(),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Price alerts require target value
      if (data.alert_type === "price_above" || data.alert_type === "price_below") {
        return data.target_value !== undefined
      }
      return true
    },
    {
      message: "Price alerts require a target value",
      path: ["target_value"],
    },
  )

// Password validation schema
export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Email validation schema
export const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export type TradeFormData = z.infer<typeof tradeSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type TagFormData = z.infer<typeof tagSchema>
export type WatchlistFormData = z.infer<typeof watchlistSchema>
export type AlertFormData = z.infer<typeof alertSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>
export type EmailFormData = z.infer<typeof emailSchema>
