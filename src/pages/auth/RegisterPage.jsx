import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import AuthLayout from '@/layouts/AuthLayout'

const schema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Numéro invalide').optional().or(z.literal('')),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      acceptTerms: false,
    },
  })

  const onSubmit = async (data) => {
    const { confirmPassword, acceptTerms, ...payload } = data
    const result = await registerUser(payload)
    if (result.success) {
      toast.success('Compte créé ! Vérifiez votre email.')
      navigate('/verify-email', { state: { previewUrl: result.previewUrl, email: data.email } })
    } else {
      toast.error(result.error)
    }
  }

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Créer un compte</h1>
        <p className="text-surface-500 mt-1">Rejoignez EasyJob dès maintenant</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Prénom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                {...register('firstName')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Jean"
              />
            </div>
            {errors.firstName && <p className="text-danger-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Nom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                {...register('lastName')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                placeholder="Dupont"
              />
            </div>
            {errors.lastName && <p className="text-danger-500 text-sm mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

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

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="tel"
              {...register('phone')}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="+243 ..."
            />
          </div>
          {errors.phone && <p className="text-danger-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-danger-500 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirmer le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-danger-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('acceptTerms')}
              className="w-4 h-4 mt-0.5 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-surface-600 dark:text-surface-400">
              J'accepte les{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-600 font-medium">
                conditions d'utilisation
              </Link>
            </span>
          </label>
          {errors.acceptTerms && <p className="text-danger-500 text-sm mt-1">{errors.acceptTerms.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {isSubmitting ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-surface-500">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}
