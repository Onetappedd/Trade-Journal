"use client";
import * as React from "react"
import { cn } from "@/lib/utils"

const ResizableContext = React.createContext<{
  isResizing: boolean
  setIsResizing: (isResizing: boolean) => void
} | null>(null)

function Resizable({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isResizing, setIsResizing] = React.useState(false)
  return (
    <ResizableContext.Provider value={{ isResizing, setIsResizing }}>
      <div
        className={cn("flex w-full h-full", className)}
        data-resizing={isResizing ? "true" : undefined}
        {...props}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  )
}

const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { minSize?: number; maxSize?: number; defaultSize?: number }
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("h-full", className)} {...props}>
      {children}
    </div>
  )
})
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(ResizableContext)
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-2 cursor-col-resize select-none items-center justify-center bg-border transition-colors hover:bg-accent",
        className
      )}
      onMouseDown={() => context?.setIsResizing(true)}
      onMouseUp={() => context?.setIsResizing(false)}
      {...props}
    >
      <div className="h-8 w-0.5 bg-muted-foreground rounded" />
    </div>
  )
})
ResizableHandle.displayName = "ResizableHandle"

export { Resizable, ResizablePanel, ResizableHandle }
