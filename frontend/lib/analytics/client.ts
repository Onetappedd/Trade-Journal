"use client"

import type { ZodSchema } from "zod"

export class AnalyticsError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function fetchJson<T>(path: string, body: any, schema?: ZodSchema<T>): Promise<T> {
  const res = await fetch(`/api/analytics/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 401) throw new AnalyticsError(`Unauthorized: please sign in again. ${text}`, 401)
    throw new AnalyticsError(`Analytics fetch failed (${res.status}): ${text}`, res.status)
  }
  const json = await res.json()
  if (schema) {
    try {
      return schema.parse(json)
    } catch (e: any) {
      const issues = e?.issues?.map((i: any) => `${i.path?.join('.')}: ${i.message}`).join('; ')
      throw new AnalyticsError(`Validation error: ${issues || e.message}`, 422)
    }
  }
  return json as T
}
