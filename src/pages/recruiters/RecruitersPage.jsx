import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MapPin,
  Bookmark,
  ChevronDown,
  Users,
  ExternalLink,
  StickyNote,
  X,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useRecruiters, useScrapeRecruiters } from '@/api/hooks'

const sectors = ['Tous', 'IT', 'Finance', 'Automobile', 'Agriculture', 'BTP', 'Marketing', 'RH']
const locations = ['Toutes', 'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès']
const connectionDegrees = ['Tous', '1st', '2nd', '3rd+']

const connectionColors = {
  '1st': 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400',
  '2nd': 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
  '3rd+': 'bg-surface-200 text-surface-600 dark:bg-surface-600 dark:text-surface-400',
}

const avatarColors = [
  'bg-primary-500',
  'bg-secondary-500',
  'bg-accent-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function FilterDropdown({ value, options, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-surface-200 bg-white py-2.5 pl-3 pr-10 text-sm font-medium text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:focus:border-primary-400"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
    </div>
  )
}

function RecruiterCard({ recruiter, index, navigate }) {
  const [showNotes, setShowNotes] = useState(false)
  const initials = `${(recruiter.firstName || '')[0] || ''}${(recruiter.lastName || '')[0] || ''}`
  const avatarColor = getAvatarColor(`${recruiter.firstName || ''}${recruiter.lastName || ''}`)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(`/recruiters/${recruiter.id}`)}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${avatarColor}`}
        >
          {initials}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => navigate(`/recruiters/${recruiter.id}`)}
            className="text-left"
          >
            <h3 className="text-lg font-bold text-surface-900 group-hover:text-primary-600 dark:text-surface-50 dark:group-hover:text-primary-400">
              {recruiter.firstName} {recruiter.lastName}
            </h3>
          </button>
          <p className="mt-0.5 text-sm font-medium text-surface-500 dark:text-surface-400">
            {recruiter.title}
          </p>
          <p className="text-sm text-surface-600 dark:text-surface-300">
            {recruiter.company}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-surface-500 dark:text-surface-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {recruiter.location}
            </span>
            {recruiter.connectionDegree && (
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${connectionColors[recruiter.connectionDegree] || 'bg-surface-200 text-surface-600'}`}
              >
                {recruiter.connectionDegree}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {recruiter.tags && recruiter.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {recruiter.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-surface-100 pt-4 dark:border-surface-700">
        {recruiter.linkedinUrl && (
          <a
            href={recruiter.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-primary-200 hover:text-primary-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-primary-500/30 dark:hover:text-primary-400"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Voir LinkedIn
          </a>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-accent-200 hover:text-accent-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-accent-500/30 dark:hover:text-accent-400"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Favoris
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowNotes(!showNotes)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:border-surface-300 hover:text-surface-700 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:border-surface-500 dark:hover:text-surface-200"
        >
          <StickyNote className="h-3.5 w-3.5" />
          Notes
        </button>
      </div>

      {/* Notes Expandable */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
              <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {recruiter.notes || 'Aucune note pour ce recruteur.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function RecruiterCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-4 w-28 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="flex gap-2 mt-2">
            <div className="h-4 w-20 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-5 w-8 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
          </div>
        </div>
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

export default function RecruitersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('Tous')
  const [location, setLocation] = useState('Toutes')
  const [connectionDegree, setConnectionDegree] = useState('Tous')
  const [page, setPage] = useState(1)

  const apiFilters = useMemo(() => {
    const filters = { page, limit: 20 }
    if (search.trim()) filters.search = search.trim()
    if (sector !== 'Tous') filters.sector = sector
    if (location !== 'Toutes') filters.location = location
    if (connectionDegree !== 'Tous') filters.connectionDegree = connectionDegree
    return filters
  }, [search, sector, location, connectionDegree, page])

  const { data, isLoading, error, refetch } = useRecruiters(apiFilters)
  const scrapeRecruitersMutation = useScrapeRecruiters()
  const recruiters = data?.recruiters ?? []
  const total = data?.total ?? recruiters.length

  const handleScrape = () => {
    scrapeRecruitersMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`${data?.newRecruiters ?? 0} nouveaux recruteurs trouvés !`, { duration: 4000 })
        refetch()
      },
      onError: (err) => {
        toast.error(err?.message || 'Erreur lors du scrapping des recruteurs')
      },
    })
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
      <motion.div
        variants={item}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Explorateur de Recruteurs
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez et explorez votre réseau de recruteurs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleScrape}
            disabled={scrapeRecruitersMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-secondary-600 dark:hover:bg-secondary-500"
          >
            {scrapeRecruitersMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {scrapeRecruitersMutation.isPending ? 'Scrapping...' : 'Scraper les recruteurs'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
          >
            <Plus className="h-4 w-4" />
            Ajouter un recruteur
          </motion.button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher par nom, entreprise, secteur..."
            className="w-full rounded-2xl border border-surface-200 bg-white py-4 pl-12 pr-4 text-surface-700 shadow-sm transition-shadow placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200 dark:placeholder:text-surface-500 dark:focus:border-primary-400"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FilterDropdown
          value={sector}
          options={sectors}
          onChange={(v) => { setSector(v); setPage(1) }}
        />
        <FilterDropdown
          value={location}
          options={locations}
          onChange={(v) => { setLocation(v); setPage(1) }}
        />
        <FilterDropdown
          value={connectionDegree}
          options={connectionDegrees}
          onChange={(v) => { setConnectionDegree(v); setPage(1) }}
        />
      </motion.div>

      {/* Results Count */}
      <motion.div variants={item}>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          <span className="font-bold text-surface-900 dark:text-surface-100">
            {isLoading ? '...' : total}
          </span>{' '}
          {total === 1 ? 'recruteur trouvé' : 'recruteurs trouvés'}
        </p>
      </motion.div>

      {/* Recruiters Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <RecruiterCardSkeleton key={i} />
          ))}
        </div>
      ) : recruiters.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {recruiters.map((recruiter, index) => (
              <RecruiterCard
                key={recruiter.id}
                recruiter={recruiter}
                index={index}
                navigate={navigate}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-16 dark:border-surface-600 dark:bg-surface-800/50"
        >
          <Users className="mb-4 h-12 w-12 text-surface-300 dark:text-surface-600" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            Aucun recruteur trouvé
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Essayez de modifier vos filtres ou votre recherche
          </p>
          {(search || sector !== 'Tous' || location !== 'Toutes' || connectionDegree !== 'Tous') && (
            <button
              onClick={() => {
                setSearch('')
                setSector('Tous')
                setLocation('Toutes')
                setConnectionDegree('Tous')
                setPage(1)
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-surface-200 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-300 dark:bg-surface-600 dark:text-surface-300 dark:hover:bg-surface-500"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
