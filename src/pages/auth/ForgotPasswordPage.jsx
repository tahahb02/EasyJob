import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from '@/layouts/AuthLayout'
import api from '@/api/axios'

const schema = z.object({
  email: z.string().email('Email invalide'),
})

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password', data)
      setEmailSent(true)
      toast.success('Lien envoyé avec succès !')
    } catch (err) {
      toast.error(err.message || 'Une erreur est survenue')
    }
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Mot de passe oublié</h1>
        <p className="text-surface-500 mt-1">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>

      {emailSent ? (
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-success-50 dark:bg-success-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <p className="text-surface-600 dark:text-surface-400">
            Un email avec les instructions de réinitialisation a été envoyé. Vérifiez votre boîte de réception.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-semibold mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="email"
                {...register('email')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="votre@email.com"
              />
            </div>
            {errors.email && <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
      )}

      {!emailSent && (
        <p className="text-center mt-6 text-sm text-surface-500">
          <Link to="/login" className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </p>
      )}
    </AuthLayout>
  )
}
