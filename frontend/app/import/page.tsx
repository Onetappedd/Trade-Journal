"use client"

import React from "react"
import { FunctionalCSVImporter } from "@/src/components/import/FunctionalCSVImporter"

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-100 mb-2">Import Trades</h1>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
            Import your trading history from CSV files or connect your brokerage accounts
          </p>
        </div>

        {/* Functional Import Interface */}
        <FunctionalCSVImporter />
      </div>
    </div>
  )
}
