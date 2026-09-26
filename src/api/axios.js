import axios from 'axios'
import { session } from '@/lib/session'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function isAccountDisabled(message) {
  return typeof message === 'string' && message.toLowerCase().includes('désactivé')
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = session.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

function forceLogout(storeMessage) {
  session.clear()
  if (storeMessage) {
    session.setLoginMessage(storeMessage)
  }
  window.dispatchEvent(new CustomEvent('easyjob:force-logout'))
}

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 403 && isAccountDisabled(error.response?.data?.error)) {
      const isLoginRequest = originalRequest?.url?.endsWith('/auth/login')
      forceLogout(isLoginRequest ? null : error.response.data.error)
      return Promise.reject(new Error(error.response.data.error))
    }

    if (error.response?.status === 401 && error.response?.data?.expired && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = session.refreshToken

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken })
          // On conserve le mode de persistance d'origine : un onglet privé ne
          // doit pas faire passer la session en localStorage.
          const remember = !!localStorage.getItem('easyjob_access_token')
          session.save({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: session.user }, remember)
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          forceLogout()
          return Promise.reject(refreshError)
        }
      }
    }

    const message = error.response?.data?.error || error.message || 'Erreur réseau'
    return Promise.reject(new Error(message))
  }
)

export default api
