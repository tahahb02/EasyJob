import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [socketError, setSocketError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSocket(null)
      setIsConnected(false)
      setSocketError(null)
      return undefined
    }

    const token = localStorage.getItem('easyjob_access_token')
    if (!token) return undefined

    const client = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    client.on('connect', () => {
      setIsConnected(true)
      setSocketError(null)
    })

    client.on('disconnect', () => setIsConnected(false))

    client.on('connect_error', (err) => setSocketError(err.message))

    client.on('notification', (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (notification?.title) {
        toast(notification.title, {
          icon: '🔔',
          duration: 4000,
        })
      }
    })

    client.on('unread_count', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] })
    })

    // Progression fine remontée par le serveur pendant la collecte d'une source.
    client.on('scraping:progress', (payload) => {
      const key = payload?.runId ? ['scraping', 'status', payload.runId] : ['scraping', 'status', 'latest']
      queryClient.invalidateQueries({ queryKey: key })
    })

    // Scraping en temps réel : invalide les requêtes dès qu'un lot est collecté
    client.on('scraping:update', (payload) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['public-board'] })
      queryClient.invalidateQueries({ queryKey: ['scraping'] })
      if (payload?.runId) queryClient.invalidateQueries({ queryKey: ['scraping', 'status', payload.runId] })
    })

    client.on('scraping:done', (payload) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['public-board'] })
      queryClient.invalidateQueries({ queryKey: ['scraping'] })
      if (payload?.runId) {
        queryClient.invalidateQueries({ queryKey: ['scraping', 'status', payload.runId] })
        queryClient.invalidateQueries({ queryKey: ['scraping', 'logs'] })
      }
    })

    setSocket(client)

    return () => {
      client.disconnect()
      setSocket(null)
      setIsConnected(false)
      setSocketError(null)
    }
  }, [isAuthenticated, user, queryClient])

  return (
    <SocketContext.Provider value={{ socket, isConnected, socketError }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
