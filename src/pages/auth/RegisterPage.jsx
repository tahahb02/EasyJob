import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Briefcase, Building2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import AuthLayout from '@/layouts/AuthLayout'

const baseSchema = z.object({
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

const recruiterSchema = baseSchema.extend({
  companyName: z.string().min(2, 'Nom de la société requis'),
  industry: z.string().min(2, 'Secteur d\'activité requis'),
  companySize: z.string().optional(),
  companyLocation: z.string().optional(),
  position: z.string().optional(),
  linkedinUrl: z.string().url('URL invalide').optional().or(z.literal('')),
})

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('candidat')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const currentSchema = selectedRole === 'recruiter' ? recruiterSchema : baseSchema

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      acceptTerms: false,
      companySize: '11-50',
    },
  })

  const onSubmit = async (data) => {
    const { confirmPassword, acceptTerms, ...payload } = data
    payload.role = selectedRole
    const result = await registerUser(payload)
    if (result.success) {
      toast.success('Compte créé ! Vérifiez votre email.')
      navigate('/verify-email', { state: { previewUrl: result.previewUrl, email: data.email } })
    } else {
      toast.error(result.error)
    }
  }

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
  const inputClassNoIcon = "w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Créer un compte</h1>
        <p className="text-surface-500 mt-1">Rejoignez EasyJob dès maintenant</p>
      </div>

      {/* Role Selection */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setSelectedRole('candidat')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
            selectedRole === 'candidat'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300'
          }`}
        >
          <User className="w-5 h-5" />
          Candidat
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('recruiter')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
            selectedRole === 'recruiter'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300'
          }`}
        >
          <Building2 className="w-5 h-5" />
          Recruteur
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Prénom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input type="text" {...register('firstName')} className={inputClass} placeholder="Jean" />
            </div>
            {errors.firstName && <p className="text-danger-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Nom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input type="text" {...register('lastName')} className={inputClass} placeholder="Dupont" />
            </div>
            {errors.lastName && <p className="text-danger-500 text-sm mt-1">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input type="email" {...register('email')} className={inputClass} placeholder="votre@email.com" />
          </div>
          {errors.email && <p className="text-danger-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input type="tel" {...register('phone')} className={inputClass} placeholder="+212 6XX XX XX XX" />
          </div>
          {errors.phone && <p className="text-danger-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>

        {/* Recruiter-specific fields */}
        {selectedRole === 'recruiter' && (
          <>
            <div className="border-t border-surface-200 dark:border-surface-700 pt-4 mt-4">
              <p className="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Informations de l'entreprise
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Nom de la société *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input type="text" {...register('companyName')} className={inputClass} placeholder="Mon Entreprise" />
              </div>
              {errors.companyName && <p className="text-danger-500 text-sm mt-1">{errors.companyName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Secteur d'activité *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <select {...register('industry')} className={inputClass}>
                    <option value="">Choisir...</option>
                    <option value="Informatique">Informatique</option>
                    <option value="Industrie">Industrie</option>
                    <option value="Génie Civil">Génie Civil</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Santé">Santé</option>
                    <option value="Éducation">Éducation</option>
                    <option value="BTP">BTP</option>
                    <option value="Télécommunications">Télécommunications</option>
                    <option value="Énergie">Énergie</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                {errors.industry && <p className="text-danger-500 text-sm mt-1">{errors.industry.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Taille</label>
                <select {...register('companySize')} className={inputClassNoIcon}>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="501-1000">501-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Localisation</label>
                <input type="text" {...register('companyLocation')} className={inputClassNoIcon} placeholder="Casablanca" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Votre poste</label>
                <input type="text" {...register('position')} className={inputClassNoIcon} placeholder="DRH" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">LinkedIn (optionnel)</label>
              <input type="url" {...register('linkedinUrl')} className={inputClassNoIcon} placeholder="https://linkedin.com/in/..." />
              {errors.linkedinUrl && <p className="text-danger-500 text-sm mt-1">{errors.linkedinUrl.message}</p>}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              className={inputClass}
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
              className={inputClass}
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
            <input type="checkbox" {...register('acceptTerms')} className="w-4 h-4 mt-0.5 rounded border-surface-300 text-primary-500 focus:ring-primary-500" />
            <span className="text-sm text-surface-600 dark:text-surface-400">
              J'accepte les{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-600 font-medium">conditions d'utilisation</Link>
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
          {isSubmitting ? 'Création...' : selectedRole === 'recruiter' ? 'Créer un compte recruteur' : 'Créer mon compte'}
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
