"use client"

import { useState, useEffect, useRef } from "react"

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const previousValue = useRef<T>(value)

  useEffect(() => {
    // Only set timeout if value actually changed
    if (JSON.stringify(previousValue.current) !== JSON.stringify(value)) {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
        previousValue.current = value
      }, delay)

      return () => {
        clearTimeout(handler)
      }
    }
  }, [value, delay])

  return debouncedValue
}
