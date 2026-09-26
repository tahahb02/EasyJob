import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { session } from '@/lib/session'
import { toast } from 'sonner'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = session.accessToken
      const savedUser = session.user

      if (token && savedUser) {
        try {
          setUser(savedUser)
          // Verify token is still valid
          const { data } = await api.get('/auth/me')
          setUser(data.user)
          session.updateUser(data.user, !!localStorage.getItem('easyjob_access_token'))
        } catch (error) {
          console.error('Session expirée:', error)
          session.clear()
          setUser(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  // Force logout when the session is invalidated (account disabled / token refresh failed)
  useEffect(() => {
    const onForceLogout = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener('easyjob:force-logout', onForceLogout)
    return () => window.removeEventListener('easyjob:force-logout', onForceLogout)
  }, [queryClient])

  const login = useCallback(async (email, password, remember = true) => {
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (data.user && data.user.isActive === false) {
        const disabledError = 'Compte désactivé temporairement, veuillez contacter le responsable ou l\'admin, merci.'
        session.clear()
        session.setLoginMessage(disabledError, remember)
        setUser(null)
        return { success: false, error: disabledError }
      }
      session.save({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }, remember)
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      const { data } = await api.post('/auth/register', userData)
      session.save({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user })
      setUser(data.user)
      return { success: true, user: data.user, emailSent: data.emailSent, emailError: data.emailError, previewUrl: data.previewUrl, fallbackCode: data.fallbackCode }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const verifyEmail = useCallback(async (email, code) => {
    try {
      const { data } = await api.post('/auth/verify-email', { email, code })
      // Update user verification status
      setUser(prev => {
        const updated = { ...prev, isEmailVerified: true }
        session.updateUser(updated, !!localStorage.getItem('easyjob_access_token'))
        return updated
      })
      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const resendVerification = useCallback(async (email) => {
    try {
      const { data } = await api.post('/auth/resend-verification', { email })
      return { success: true, message: data.message, emailSent: data.emailSent, emailError: data.emailError, previewUrl: data.previewUrl, fallbackCode: data.fallbackCode }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Ignore error on logout
    } finally {
      session.clear()
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      const { data } = await api.put('/profile', updates)
      const updatedUser = data.user
      setUser(updatedUser)
      session.updateUser(updatedUser, !!localStorage.getItem('easyjob_access_token'))
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      return { success: true, user: updatedUser, profile: data.profile }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [queryClient])

  const forgotPassword = useCallback(async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password })
      return { success: true, message: data.message }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, verifyEmail, resendVerification,
      updateProfile, forgotPassword, resetPassword,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
