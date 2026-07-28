import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Search,
  RefreshCw,
  MapPin,
  Bookmark,
  ChevronDown,
  Briefcase,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Eye,
  CheckCircle,
  Building2,
  Send,
  UserCheck,
  Inbox,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import {
  useJobs,
  useToggleSaveJob,
  useRunScraping,
  useMarkApplied,
  useApplications,
  useRecruiterJobBoard,
  useApplyToRecruiterJob,
} from '@/api/hooks'

const tabs = [
  { key: 'external', label: 'Offres externes', icon: Briefcase },
  { key: 'internal', label: 'Offres internes', icon: Building2 },
]

const contractTypes = ['Tous', 'CDI', 'CDD', 'Stage', 'Freelance']
const locations = ['Toutes', 'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès']

const externalSources = ['Toutes', 'linkedin', 'indeed', 'welcometothejungle', 'rekrute', 'manpower']
const sortOptions = ['Pertinence', 'Date', 'Salaire']

const sourceLabels = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  welcometothejungle: 'Welcome to the Jungle',
  rekrute: 'Rekrute',
  manpower: 'Manpower',
  recruiter: 'Recruteur',
}

const sourceColors = {
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  indeed: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  welcometothejungle: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  rekrute: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  manpower: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  recruiter: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400',
}

function RelevanceCircle({ score, size = 40 }) {
  const radius = size / 2 - 4
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ((score || 0) / 100) * circumference
  const color = score >= 90 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'
  const fontSize = size <= 32 ? 'text-[10px]' : 'text-xs'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-surface-200 dark:text-surface-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-bold text-surface-700 dark:text-surface-300 ${fontSize}`}>
        {score ?? 0}
      </span>
    </div>
  )
}

function FilterDropdown({ label, value, options, onChange, renderOption }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-surface-200 bg-white py-2.5 pl-3 pr-10 text-sm font-medium text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:focus:border-primary-400"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {renderOption ? renderOption(opt) : opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
    </div>
  )
}

function ExternalJobCard({ job, index, onSave, navigate, appliedJobIds, onMarkApplied }) {
  const isApplied = appliedJobIds?.has(job.id)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="group cursor-pointer rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${sourceColors[job.source] || 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'}`}>
              {sourceLabels[job.source] || job.source}
            </span>
            <span className="inline-block rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400">
              {job.contractType}
            </span>
            {isApplied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400">
                <CheckCircle className="h-3 w-3" />
                Postulé
              </span>
            )}
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
              {job.isRemote && <span className="ml-1 text-xs text-secondary-500">(Remote)</span>}
            </span>
            {job.salary && (
              <span className="font-medium text-surface-700 dark:text-surface-300">
                {job.salary.min?.toLocaleString('fr-MA')} - {job.salary.max?.toLocaleString('fr-MA')} MAD/mois
              </span>
            )}
            {job.postedAt && (
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true, locale: fr })}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <RelevanceCircle score={job.relevanceScore} />
          <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500">pertinence</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-surface-100 pt-4 dark:border-surface-700">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`) }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-primary-500/30 dark:hover:text-primary-400"
        >
          <Eye className="h-4 w-4" />
          Détails
        </button>
        {job.sourceUrl && (
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
          >
            <ExternalLink className="h-4 w-4" />
            Postuler
          </a>
        )}
        {!isApplied && (
          <button onClick={(e) => { e.stopPropagation(); onMarkApplied(job.id) }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-100 dark:border-secondary-500/30 dark:bg-secondary-500/10 dark:text-secondary-400 dark:hover:bg-secondary-500/20"
          >
            <CheckCircle className="h-4 w-4" />
            J'ai postulé
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onSave(job.id) }}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            job.isSaved
              ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400'
              : 'border-surface-200 bg-white text-surface-600 hover:border-primary-200 hover:text-primary-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-primary-500/30 dark:hover:text-primary-400'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${job.isSaved ? 'fill-current' : ''}`} />
          Sauvegarder
        </button>
      </div>
    </motion.div>
  )
}

function InternalJobCard({ job, index, appliedJobIds, onApply, isApplying }) {
  const isApplied = appliedJobIds?.has(job.id)
  const score = job.matchScore ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400">
              Recruteur
            </span>
            <span className="inline-block rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400">
              {job.contractType}
            </span>
            {job.isRemote && (
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-400">
                Remote
              </span>
            )}
            {isApplied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400">
                <CheckCircle className="h-3 w-3" />
                Postulé
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">
            {job.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-surface-500 dark:text-surface-400">
            {job.company}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            {job.salary && (
              <span className="font-medium text-surface-700 dark:text-surface-300">
                {job.salary.min?.toLocaleString('fr-MA')} - {job.salary.max?.toLocaleString('fr-MA')} MAD/mois
              </span>
            )}
            {job.postedAt && (
              <span className="text-xs text-surface-400 dark:text-surface-500">
                {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true, locale: fr })}
              </span>
            )}
          </div>

          {job.postedBy && (
            <p className="mt-2 text-xs text-surface-400 dark:text-surface-500">
              Recruteur : {job.postedBy.firstName} {job.postedBy.lastName}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <RelevanceCircle score={score} />
          <span className="text-[10px] font-medium text-surface-400 dark:text-surface-500">match</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-surface-100 pt-4 dark:border-surface-700">
        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-primary-500/30 dark:hover:text-primary-400"
        >
          <Eye className="h-4 w-4" />
          Détails
        </Link>
        {!isApplied && (
          <button
            onClick={() => onApply(job.id)}
            disabled={isApplying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-60 dark:bg-primary-600 dark:hover:bg-primary-500"
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Postuler
          </button>
        )}
        {isApplied && (
          <Link
            to="/applications/internal"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-100 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20"
          >
            <UserCheck className="h-4 w-4" />
            Suivre ma candidature
          </Link>
        )}
      </div>
    </motion.div>
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
          <div className="flex gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          </div>
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
      </div>
    </div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function JobOffersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('external')

  // External filters
  const [search, setSearch] = useState('')
  const [contractType, setContractType] = useState('Tous')
  const [location, setLocation] = useState('Toutes')
  const [source, setSource] = useState('Toutes')
  const [sort, setSort] = useState('Date')
  const [page, setPage] = useState(1)

  const apiFilters = useMemo(() => {
    const filters = { page, limit: 20 }
    if (search.trim()) filters.search = search.trim()
    if (contractType !== 'Tous') filters.contractType = contractType
    if (location !== 'Toutes') filters.location = location
    if (activeTab === 'external') {
      if (source !== 'Toutes') filters.source = source
      if (sort === 'Date') filters.sort = 'date'
      else if (sort === 'Salaire') filters.sort = 'salary'
      else filters.sort = 'relevance'
    }
    if (activeTab === 'internal') {
      filters.matched = 'true'
      filters.limit = 50
    }
    return filters
  }, [search, contractType, location, source, sort, page, activeTab])

  const { data, isLoading, error, refetch } = activeTab === 'external'
    ? useJobs(apiFilters)
    : useRecruiterJobBoard(apiFilters)

  const toggleSave = useToggleSaveJob()
  const runScraping = useRunScraping()
  const markApplied = useMarkApplied()
  const applyToRecruiter = useApplyToRecruiterJob()
  const { data: appsData } = useApplications({})

  const offers = data?.jobs ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  const appliedJobIds = useMemo(() => {
    const ids = new Set()
    if (appsData?.applications) {
      appsData.applications.forEach(a => {
        if (a.jobOfferId?._id) ids.add(a.jobOfferId._id)
        else if (a.jobOfferId) ids.add(a.jobOfferId)
      })
    }
    return ids
  }, [appsData])

  const handleSave = (id) => { toggleSave.mutate(id) }

  const handleScraping = () => {
    runScraping.mutate(undefined, { onSuccess: () => refetch() })
  }

  const handleMarkApplied = (jobId) => {
    markApplied.mutate(jobId, {
      onSuccess: () => toast.success('Candidature enregistrée !'),
      onError: (err) => toast.error(err?.message || 'Erreur'),
    })
  }

  const handleApplyInternal = (jobId) => {
    applyToRecruiter.mutate({ jobId }, {
      onSuccess: () => toast.success('Candidature envoyée avec succès !'),
      onError: (err) => toast.error(err?.message || 'Erreur'),
    })
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Offres d'emploi
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            {activeTab === 'external'
              ? 'Offres importées depuis les plateformes externes'
              : 'Offres internes publiées par les recruteurs'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/applications"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-3 text-sm font-semibold text-surface-700 shadow-sm transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <Inbox className="h-4 w-4" />
            Mes candidatures
          </Link>
          {activeTab === 'external' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleScraping}
              disabled={runScraping.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-600 dark:hover:bg-primary-500"
            >
              {runScraping.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {runScraping.isPending ? 'Scrapping en cours...' : 'Lancer le scrapping'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 rounded-2xl border border-surface-200 bg-white p-1.5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); setSearch('') }}
              className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="jobTab"
                  className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-500/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={activeTab === 'external' ? "Rechercher par titre, entreprise, mot-clé..." : "Rechercher parmi les offres recruteurs..."}
            className="w-full rounded-2xl border border-surface-200 bg-white py-4 pl-12 pr-4 text-surface-700 shadow-sm transition-shadow placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200 dark:placeholder:text-surface-500 dark:focus:border-primary-400"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FilterDropdown label="Contrat" value={contractType} options={contractTypes} onChange={(v) => { setContractType(v); setPage(1) }} />
        <FilterDropdown label="Lieu" value={location} options={locations} onChange={(v) => { setLocation(v); setPage(1) }} />
        {activeTab === 'external' && (
          <>
            <FilterDropdown label="Source" value={source} options={externalSources} onChange={(v) => { setSource(v); setPage(1) }}
              renderOption={(opt) => (opt === 'Toutes' ? 'Toutes' : sourceLabels[opt] || opt)} />
            <FilterDropdown label="Trier" value={sort} options={sortOptions} onChange={setSort} />
          </>
        )}
        {activeTab === 'internal' && (
          <>
            <div />
            <div className="flex items-center text-sm text-surface-400 dark:text-surface-500">
              Offres classées par pertinence avec votre profil
            </div>
          </>
        )}
      </motion.div>

      {/* Results Count */}
      <motion.div variants={item} className="flex items-center justify-between">
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          <span className="font-bold text-surface-900 dark:text-surface-100">
            {isLoading ? '...' : total}
          </span>{' '}
          {total === 1 ? 'offre trouvée' : 'offres trouvées'}
        </p>
        {activeTab === 'internal' && (
          <Link
            to="/applications/internal"
            className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
          >
            Voir mes candidatures internes →
          </Link>
        )}
      </motion.div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger-300 bg-danger-50 py-12 dark:border-danger-500/30 dark:bg-danger-500/5">
          <AlertTriangle className="mb-3 h-10 w-10 text-danger-400" />
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-danger-500">{error?.message || 'Une erreur est survenue.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-600">
            Réessayer
          </button>
        </div>
      )}

      {/* Job Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : offers.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeTab === 'external' ? (
            offers.map((job, index) => (
              <ExternalJobCard
                key={job.id}
                job={job}
                index={index}
                onSave={handleSave}
                navigate={navigate}
                appliedJobIds={appliedJobIds}
                onMarkApplied={handleMarkApplied}
              />
            ))
          ) : (
            offers.map((job, index) => (
              <InternalJobCard
                key={job.id}
                job={job}
                index={index}
                appliedJobIds={appliedJobIds}
                onApply={handleApplyInternal}
                isApplying={applyToRecruiter.isPending}
              />
            ))
          )}
        </motion.div>
      ) : (
        !error && (
          <motion.div variants={item} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-16 dark:border-surface-600 dark:bg-surface-800/50">
            <Search className="mb-4 h-12 w-12 text-surface-300 dark:text-surface-600" />
            <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">
              {activeTab === 'external' ? 'Aucune offre externe trouvée' : 'Aucune offre recruteur disponible'}
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              {activeTab === 'external'
                ? 'Essayez de modifier vos filtres ou lancez un scrapping'
                : 'Revenez plus tard, de nouvelles offres seront publiées'}
            </p>
          </motion.div>
        )
      )}

      {/* Pagination */}
      {pages > 1 && (
        <motion.div variants={item} className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 disabled:opacity-40 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700">
            Précédent
          </button>
          <span className="px-4 py-2 text-sm font-medium text-surface-500 dark:text-surface-400">
            Page {page} / {pages}
          </span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 disabled:opacity-40 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700">
            Suivant
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
