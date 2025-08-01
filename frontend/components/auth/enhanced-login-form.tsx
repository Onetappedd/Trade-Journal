"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import Link from "next/link"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const EnhancedLoginForm = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState<boolean>(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
    } else {
      router.push("/dashboard")
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleSocialLogin = async (provider: "google" | "discord") => {
    if (provider === "google") setIsGoogleLoading(true)
    if (provider === "discord") setIsDiscordLoading(true)

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (provider === "google") setIsGoogleLoading(false)
    if (provider === "discord") setIsDiscordLoading(false)
  }

  return (
    <Card className="relative z-10 w-full max-w-md bg-black/30 border-white/20 text-white backdrop-blur-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription className="text-gray-400">Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-6">
          <Button
            variant="outline"
            className="bg-transparent border-white/20 hover:bg-white/10"
            onClick={() => handleSocialLogin("google")}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-white/20 hover:bg-white/10"
            onClick={() => handleSocialLogin("discord")}
            disabled={isDiscordLoading}
          >
            {isDiscordLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.discord className="mr-2 h-4 w-4" />
            )}
            Discord
          </Button>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-gray-400">Or continue with</span>
          </div>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-2">
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...form.register("email")}
              className="bg-transparent border-white/20 focus:ring-white/50"
            />
            {form.formState.errors?.email && (
              <p className="px-1 text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              {...form.register("password")}
              className="bg-transparent border-white/20 focus:ring-white/50"
            />
            {form.formState.errors?.password && (
              <p className="px-1 text-xs text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button disabled={isLoading} className="mt-2 bg-indigo-600 hover:bg-indigo-700">
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm text-center">
        <Link href="/auth/reset-password" passHref>
          <span className="text-gray-400 hover:text-white cursor-pointer">Forgot your password?</span>
        </Link>
        <p className="px-8 text-center text-xs text-gray-500">
          By clicking continue, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  )
}
