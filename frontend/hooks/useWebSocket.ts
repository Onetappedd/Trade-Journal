"use client"

import { useEffect, useRef, useState } from 'react'

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  onMessage?: (event: MessageEvent) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  
  const {
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options

  useEffect(() => {
    if (!url) return

    const connect = () => {
      try {
        const ws = new WebSocket(url)
        
        ws.onopen = (event) => {
          setIsConnected(true)
          reconnectAttemptsRef.current = 0
          onOpen?.(event)
        }

        ws.onclose = (event) => {
          setIsConnected(false)
          onClose?.(event)
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++
            reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
          }
        }

        ws.onerror = (event) => {
          onError?.(event)
        }

        ws.onmessage = (event) => {
          onMessage?.(event)
        }

        setSocket(ws)
      } catch (error) {
        console.error('WebSocket connection failed:', error)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        socket.close(1000, 'Component unmounting')
      }
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnectInterval, maxReconnectAttempts])

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.close(1000, 'Manual disconnect')
    }
  }

  return {
    socket,
    isConnected,
    sendMessage,
    disconnect
  }
}
