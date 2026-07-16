import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react'
import AuthLayout from '@/layouts/AuthLayout'
import toast from 'react-hot-toast'
import api from '@/api/axios'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Le mot de passe doit contenir au moins 6 caractères')
    if (password !== confirmPassword) return toast.error('Les mots de passe ne correspondent pas')
    setLoading(true)
    try {
      await api.post(`/auth/reset-password/${token}`, { password })
      setSuccess(true)
      toast.success('Mot de passe réinitialisé !')
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la réinitialisation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-secondary-500" />
          </div>
          <h1 className="text-2xl font-bold text-surface-800 dark:text-white mb-2">Mot de passe réinitialisé</h1>
          <p className="text-surface-500 mb-6">Votre mot de passe a été modifié avec succès.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition">
            Se connecter
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Nouveau mot de passe</h1>
            <p className="text-surface-500 mt-1">Choisissez un mot de passe sécurisé</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-surface-500">
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
              Retour à la connexion
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
