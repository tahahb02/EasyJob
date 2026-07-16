import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Bookmark,
  ExternalLink,
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  Tag,
  CircleDollarSign,
  Wifi,
  Building,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { useJob, useToggleSaveJob } from '@/api/hooks'

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

function RelevanceCircleLarge({ score }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ((score || 0) / 100) * circumference

  const color =
    score >= 90 ? '#10B981' : score >= 75 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="absolute h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-surface-200 dark:text-surface-700"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="text-center">
        <span className="text-2xl font-bold text-surface-800 dark:text-surface-200">
          {score ?? 0}
        </span>
        <span className="block text-[10px] font-medium text-surface-400 dark:text-surface-500">
          /100
        </span>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-4">
            <div className="h-5 w-20 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
            <div className="h-8 w-72 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="flex gap-4">
              <div className="h-5 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
              <div className="h-5 w-24 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
              <div className="h-8 w-32 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
            </div>
          </div>
          <div className="h-28 w-28 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-64 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
          <div className="h-48 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
          <div className="h-56 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
        </div>
      </div>
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function JobOfferDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error } = useJob(id)
  const toggleSave = useToggleSaveJob()

  const job = data?.job

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          {error ? (
            <AlertTriangle className="mb-4 h-16 w-16 text-danger-400" />
          ) : (
            <Briefcase className="mb-4 h-16 w-16 text-surface-300 dark:text-surface-600" />
          )}
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {error ? 'Erreur de chargement' : 'Offre non trouvée'}
          </h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            {error ? error.message : "Cette offre n'existe pas ou a été supprimée."}
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux offres
          </button>
        </motion.div>
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
      {/* Back Button */}
      <motion.div variants={item}>
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux offres
        </button>
      </motion.div>

      {/* Header Section */}
      <motion.div
        variants={item}
        className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${sourceColors[job.source] || 'bg-surface-100 text-surface-600'}`}
            >
              {sourceLabels[job.source] || job.source}
            </span>

            <h1 className="mt-3 text-3xl font-bold text-surface-900 dark:text-surface-50">
              {job.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-surface-500 dark:text-surface-400">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{job.company}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {job.location}
                {job.isRemote && (
                  <span className="text-xs text-secondary-500">(Remote)</span>
                )}
              </span>
              {job.postedAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDistanceToNow(new Date(job.postedAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <RelevanceCircleLarge score={job.relevanceScore} />
          </div>
        </div>

        {/* Info Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1.5 text-sm font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
            <Briefcase className="h-3.5 w-3.5" />
            {job.contractType}
          </span>
          {job.salary && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1.5 text-sm font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {job.salary.min?.toLocaleString('fr-MA')} - {job.salary.max?.toLocaleString('fr-MA')} MAD/mois
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-3 py-1.5 text-sm font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
            {job.isRemote ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                Télétravail
              </>
            ) : (
              <>
                <Building className="h-3.5 w-3.5" />
                Sur site
              </>
            )}
          </span>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <h2 className="mb-4 text-xl font-bold text-surface-900 dark:text-surface-50">
              Description
            </h2>
            <p className="leading-relaxed text-surface-600 dark:text-surface-400">
              {job.description || 'Aucune description disponible.'}
            </p>
          </motion.div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <motion.div
              variants={item}
              className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
            >
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                <CheckCircle2 className="h-5 w-5 text-secondary-500" />
                Exigences
              </h2>
              <ul className="space-y-3">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <motion.div
              variants={item}
              className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
            >
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                <ListTodo className="h-5 w-5 text-accent-500" />
                Responsabilités
              </h2>
              <ul className="space-y-3">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-surface-600 dark:text-surface-400">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    {resp}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Actions Card */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <h3 className="mb-4 text-lg font-bold text-surface-900 dark:text-surface-50">
              Actions
            </h3>
            <div className="space-y-3">
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  Postuler sur {sourceLabels[job.source] || 'la source'}
                </a>
              )}
              <button
                onClick={() => toggleSave.mutate(job.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700"
              >
                <Bookmark className={`h-4 w-4 ${job.isSaved ? 'fill-current text-primary-500' : ''}`} />
                {job.isSaved ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>
          </motion.div>

          {/* Informations Card */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <h3 className="mb-4 text-lg font-bold text-surface-900 dark:text-surface-50">
              Informations
            </h3>
            <div className="space-y-4">
              {job.sector && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-700">
                    <Building2 className="h-4 w-4 text-surface-500 dark:text-surface-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
                      Secteur
                    </p>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {job.sector}
                    </p>
                  </div>
                </div>
              )}

              {job.postedAt && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-700">
                    <Calendar className="h-4 w-4 text-surface-500 dark:text-surface-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
                      Publiée
                    </p>
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                      {formatDistanceToNow(new Date(job.postedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {job.keywords && job.keywords.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-surface-400 dark:text-surface-500">
                    Mots-clés
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                      >
                        <Tag className="h-3 w-3" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
