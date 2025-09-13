"use client"

import { useEffect, useRef, useState } from "react"

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void
  onMessage?: (event: MessageEvent) => void
  onError?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

interface UseWebSocketReturn {
  socket: WebSocket | null
  connectionStatus: "connecting" | "connected" | "disconnected" | "error"
  sendMessage: (message: string | object) => void
  disconnect: () => void
  reconnect: () => void
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { onOpen, onMessage, onError, onClose, reconnectAttempts = 3, reconnectInterval = 3000 } = options

  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  )
  const reconnectCount = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = () => {
    try {
      setConnectionStatus("connecting")

      // In development, we'll simulate WebSocket connection
      // In production, this would be a real WebSocket URL
      const wsUrl = url.startsWith("/") ? `ws://localhost:3001${url}` : url

      // For development, create a mock WebSocket-like object
      const mockSocket = {
        readyState: WebSocket.CONNECTING,
        send: (data: string) => {
          console.log("[WebSocket] Sending:", data)
          // Simulate receiving echo or response
          setTimeout(() => {
            if (mockSocket.onmessage) {
              mockSocket.onmessage({
                data: JSON.stringify({ type: "echo", data: JSON.parse(data) }),
                type: "message",
              } as MessageEvent)
            }
          }, 100)
        },
        close: () => {
          mockSocket.readyState = WebSocket.CLOSED
          setConnectionStatus("disconnected")
          if (mockSocket.onclose) {
            mockSocket.onclose({} as CloseEvent)
          }
        },
        onopen: null as ((event: Event) => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onclose: null as ((event: CloseEvent) => void) | null,
      } as WebSocket

      // Set up event handlers
      mockSocket.onopen = (event: Event) => {
        setConnectionStatus("connected")
        reconnectCount.current = 0
        onOpen?.(event)
      }

      mockSocket.onmessage = (event: MessageEvent) => {
        onMessage?.(event)
      }

      mockSocket.onerror = (event: Event) => {
        setConnectionStatus("error")
        onError?.(event)
      }

      mockSocket.onclose = (event: CloseEvent) => {
        setConnectionStatus("disconnected")
        onClose?.(event)

        // Auto-reconnect logic
        if (reconnectCount.current < reconnectAttempts) {
          reconnectCount.current++
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      // Simulate connection success
      setTimeout(() => {
        mockSocket.readyState = WebSocket.OPEN
        if (mockSocket.onopen) {
          mockSocket.onopen({} as Event)
        }
      }, 500)

      setSocket(mockSocket)
    } catch (error) {
      setConnectionStatus("error")
      console.error("[WebSocket] Connection failed:", error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    reconnectCount.current = reconnectAttempts // Prevent auto-reconnect
    socket?.close()
  }

  const reconnect = () => {
    disconnect()
    setTimeout(connect, 100)
  }

  const sendMessage = (message: string | object) => {
    if (socket && connectionStatus === "connected") {
      const messageStr = typeof message === "string" ? message : JSON.stringify(message)
      socket.send(messageStr)
    } else {
      console.warn("[WebSocket] Cannot send message - not connected")
    }
  }

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socket?.close()
    }
  }, [url])

  return {
    socket,
    connectionStatus,
    sendMessage,
    disconnect,
    reconnect,
  }
}
