import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AdminGuard() {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to={user?.role === 'recruiter' ? '/recruiter-space/dashboard' : '/dashboard'} replace />
  }

  return <Outlet />
}