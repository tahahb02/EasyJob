import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  Clock,
  TrendingUp,
  Search,
  UserPlus2,
  MapPin,
  ArrowRight,
  Loader2,
} from 'lucide-react'

import { useRecruiters } from '@/api/hooks'

const avatarColors = [
  'bg-primary-500', 'bg-secondary-500', 'bg-accent-500', 'bg-purple-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500',
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const connectionColors = {
  '1st': 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400',
  '2nd': 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
  '3rd+': 'bg-surface-200 text-surface-600 dark:bg-surface-600 dark:text-surface-400',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function NetworkPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useRecruiters()
  const recruiters = data?.recruiters ?? []

  const totalConnections = recruiters.length
  const firstDegree = recruiters.filter((r) => r.connectionDegree === '1st').length
  const suggestedRecruiters = recruiters.filter((r) => r.connectionDegree !== '1st').slice(0, 4)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
        <p className="mt-4 text-surface-500 dark:text-surface-400">Chargement du réseau...</p>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">Mon Réseau</h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">Gérez vos connexions et suivez vos interactions</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-primary-50 p-3 dark:bg-primary-500/10"><Users className="h-5 w-5 text-primary-500" /></div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">{totalConnections}</p>
            <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">Connexions totales</p>
          </div>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-accent-50 p-3 dark:bg-accent-500/10"><UserPlus className="h-5 w-5 text-accent-500" /></div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">{firstDegree}</p>
            <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">Connexions directes</p>
          </div>
        </motion.div>
      </motion.div>

      {suggestedRecruiters.length > 0 && (
        <motion.div variants={item}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Connexions suggérées</h2>
            <button onClick={() => navigate('/recruiters')} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400">
              Voir tous <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggestedRecruiters.map((recruiter) => {
              const initials = `${recruiter.firstName[0]}${recruiter.lastName[0]}`
              const avatarColor = getAvatarColor(`${recruiter.firstName}${recruiter.lastName}`)
              return (
                <motion.div key={recruiter._id} variants={item} whileHover={{ y: -4 }} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800">
                  <div className="flex flex-col items-center text-center">
                    <button onClick={() => navigate(`/recruiters/${recruiter._id}`)} className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white ${avatarColor}`}>
                      {initials}
                    </button>
                    <button onClick={() => navigate(`/recruiters/${recruiter._id}`)} className="mt-3 text-center">
                      <h3 className="text-sm font-bold text-surface-900 hover:text-primary-600 dark:text-surface-50 dark:hover:text-primary-400">
                        {recruiter.firstName} {recruiter.lastName}
                      </h3>
                    </button>
                    <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{recruiter.title}</p>
                    <p className="text-xs text-surface-600 dark:text-surface-300">{recruiter.company}</p>
                    <span className="mt-2 flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                      <MapPin className="h-3 w-3" /> {recruiter.location}
                    </span>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${connectionColors[recruiter.connectionDegree] || connectionColors['3rd+']}`}>
                      {recruiter.connectionDegree}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {recruiters.length === 0 && (
        <motion.div variants={item} className="rounded-2xl border border-surface-200 bg-white p-12 text-center shadow-sm dark:border-surface-700 dark:bg-surface-800">
          <Users className="mx-auto mb-4 h-12 w-12 text-surface-300 dark:text-surface-600" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">Aucun recruteur</h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Lancez le scraper de recruteurs pour trouver des contacts.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
