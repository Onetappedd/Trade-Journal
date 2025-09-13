"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  id: string
  label: string
  type?: "text" | "email" | "password" | "textarea"
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  success?: string
  helperText?: string
  className?: string
}

export function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  required = false,
  error,
  success,
  helperText,
  className,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const isPassword = type === "password"

  const inputClasses = cn(
    "w-full px-4 py-3 bg-slate-800/50 border rounded-lg text-slate-300 placeholder-slate-500 transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    {
      "border-slate-700/50": !hasError && !hasSuccess && !isFocused,
      "border-emerald-500/50 ring-2 ring-emerald-500/20": hasSuccess,
      "border-red-500/50 ring-2 ring-red-500/20": hasError,
      "border-emerald-500/50": isFocused && !hasError,
      "pr-12": isPassword,
    },
    className,
  )

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            onBlur?.()
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          rows={3}
        />
      )
    }

    return (
      <div className="relative">
        <Input
          id={id}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            onBlur?.()
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-slate-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </Label>

      {renderInput()}

      {/* Status indicators and helper text */}
      <div className="min-h-[20px]">
        {hasError && (
          <div className="flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        {hasSuccess && (
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}
        {!hasError && !hasSuccess && helperText && <p className="text-sm text-slate-400">{helperText}</p>}
      </div>
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  className?: string
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-slate-800/50",
        className,
      )}
    >
      {children}
    </div>
  )
}

interface SubmitButtonProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  variant?: "primary" | "secondary" | "destructive"
  onClick?: () => void
  type?: "button" | "submit"
  className?: string
}

export function SubmitButton({
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  onClick,
  type = "button",
  className,
}: SubmitButtonProps) {
  const baseClasses = "min-w-[120px] transition-all duration-200"

  const variantClasses = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-600/50",
    secondary: "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent",
    destructive: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-600/50",
  }

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      variant={variant === "primary" || variant === "destructive" ? "default" : "outline"}
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {children}
    </Button>
  )
}

interface DangerZoneProps {
  title: string
  description: string
  children: React.ReactNode
}

export function DangerZone({ title, description, children }: DangerZoneProps) {
  return (
    <div className="pt-6 border-t border-slate-800/50">
      <div className="bg-red-950/20 border border-red-800/50 rounded-lg p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-red-400 font-semibold">{title}</h4>
            <p className="text-red-300 text-sm mt-1">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
