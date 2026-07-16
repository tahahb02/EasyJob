import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bookmark,
  MapPin,
  Briefcase,
  BookmarkX,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { useSavedJobs, useToggleSaveJob } from '@/api/hooks'

const sourceLabels = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  welcometothejungle: 'Welcome to the Jungle',
  rekrute: 'Rekrute',
  manpower: 'Manpower',
}

const sourceColors = {
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  indeed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  welcometothejungle: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  rekrute: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  manpower: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

function RelevanceCircle({ score }) {
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ((score || 0) / 100) * circumference

  const color =
    score >= 90 ? '#10B981' : score >= 75 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <svg className="absolute h-10 w-10 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-surface-200 dark:text-surface-700"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs font-bold text-surface-700 dark:text-surface-300">
        {score ?? 0}
      </span>
    </div>
  )
}

function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
          </div>
          <div className="h-6 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
      </div>
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function SavedJobsPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useSavedJobs()
  const toggleSave = useToggleSaveJob()

  const offers = data?.jobs ?? []

  const handleUnsave = (id) => {
    toggleSave.mutate(id)
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger-300 bg-danger-50 py-12 dark:border-danger-500/30 dark:bg-danger-500/5">
          <AlertTriangle className="mb-3 h-10 w-10 text-danger-400" />
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-danger-500">{error?.message || 'Une erreur est survenue.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-600">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
          Offres sauvegardées
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Retrouvez les offres que vous avez enregistrées
        </p>
      </motion.div>

      {/* Results Count */}
      <motion.div variants={item}>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          <span className="font-bold text-surface-900 dark:text-surface-100">
            {isLoading ? '...' : offers.length}
          </span>{' '}
          {offers.length === 1 ? 'offre sauvegardée' : 'offres sauvegardées'}
        </p>
      </motion.div>

      {/* Job Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : offers.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {offers.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="group cursor-pointer rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${sourceColors[job.source] || 'bg-surface-100 text-surface-600'}`}
                    >
                      {sourceLabels[job.source] || job.source}
                    </span>
                    <span className="inline-block rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                      {job.contractType}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-600 dark:text-surface-50 dark:group-hover:text-primary-400">
                    {job.title}
                  </h3>

                  <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">
                    {job.company}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-surface-500 dark:text-surface-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                      {job.isRemote && (
                        <span className="ml-1 text-xs text-secondary-500">(Remote)</span>
                      )}
                    </span>
                    {job.salary && (
                      <span className="font-medium text-surface-700 dark:text-surface-300">
                        {job.salary.min?.toLocaleString('fr-MA')} - {job.salary.max?.toLocaleString('fr-MA')} MAD/mois
                      </span>
                    )}
                    {job.postedAt && (
                      <span className="text-xs text-surface-400 dark:text-surface-500">
                        {formatDistanceToNow(new Date(job.postedAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-center gap-1">
                  <RelevanceCircle score={job.relevanceScore} />
                  <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500">
                    pertinence
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-surface-100 pt-4 dark:border-surface-700">
                {job.sourceUrl && (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-primary-500/30 dark:hover:text-primary-400"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir sur {sourceLabels[job.source] || job.source}
                  </a>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnsave(job.id)
                  }}
                  disabled={toggleSave.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-100 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-400 dark:hover:bg-danger-500/20"
                >
                  {toggleSave.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookmarkX className="h-4 w-4" />
                  )}
                  Retirer
                </button>

                <Link
                  to={`/applications/compose/${job.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
                >
                  <Briefcase className="h-4 w-4" />
                  Postuler
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-20 dark:border-surface-600 dark:bg-surface-800/50"
        >
          <div className="rounded-full bg-surface-100 p-5 dark:bg-surface-700">
            <Bookmark className="h-10 w-10 text-surface-400 dark:text-surface-500" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-surface-700 dark:text-surface-300">
            Aucune offre sauvegardée
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Parcourez les offres et sauvegardez celles qui vous intéressent
          </p>
          <Link
            to="/jobs"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Voir les offres
          </Link>
        </motion.div>
      )}
    </motion.div>
  )
}
