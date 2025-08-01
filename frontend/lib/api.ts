import { supabase } from "./supabase"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error("No authentication token available")
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        window.location.href = "/login"
        return
      }
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("API request error:", error)
    throw error
  }
}

// Trade API functions
export const tradeApi = {
  addTrade: (tradeData: any) =>
    apiRequest("/api/add-trade", {
      method: "POST",
      body: JSON.stringify(tradeData),
    }),

  importTrades: (formData: FormData) =>
    apiRequest("/api/import-trades", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    }),

  getTrades: () => apiRequest("/api/trades"),

  updateTrade: (tradeId: string, tradeData: any) =>
    apiRequest(`/api/trades/${tradeId}`, {
      method: "PUT",
      body: JSON.stringify(tradeData),
    }),

  deleteTrade: (tradeId: string) =>
    apiRequest(`/api/trades/${tradeId}`, {
      method: "DELETE",
    }),
}
