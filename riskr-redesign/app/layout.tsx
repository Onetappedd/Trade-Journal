import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import ConditionalLayout from "@/components/conditional-layout"
import "./globals.css"

export const metadata: Metadata = {
  title: "RiskR - Professional Trading Analytics",
  description: "Advanced trading journal and portfolio analytics platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  )
}
