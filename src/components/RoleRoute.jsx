import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Restreint une section de l'application à certains rôles.
 *
 * Le backend appliquait déjà `authorize(...)` sur les routes concernées : sans
 * garde frontend, un candidat pouvait navigate manuellement vers
 * `/recruiter-space/*`, charger tout le bundle de la page, puis se prendre un
 * 403 sur chaque appel API (écrans vides et messages d'erreur trompeurs).
 *
 * Le rôle `admin` est toujours autorisé : l'administrateur doit pouvoir
 * consulter les espaces recruteur et candidat.
 */
export default function RoleRoute({ roles, redirectTo = '/dashboard' }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
