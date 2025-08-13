"use client"

import React from "react"

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border rounded-md p-4 bg-destructive/10">
          <div className="text-destructive font-medium">Something went wrong</div>
          <div className="text-muted-foreground text-sm mb-2">{String(this.state.error)}</div>
          <button
            className="text-sm px-3 py-1 rounded-md border bg-muted"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}
