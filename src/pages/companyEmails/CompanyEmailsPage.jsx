import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Mail,
  Globe,
  Phone,
  MapPin,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  X,
  Loader2,
  Building,
  Users,
  Briefcase,
  GraduationCap,
  Factory,
  Landmark,
  Rocket,
  Shield,
  MailCheck,
  Copy,
  Check,
} from 'lucide-react'

import { useCompanyEmails, useCompanyEmailFilters } from '@/api/hooks'

const companyTypeLabels = {
  multinationale: 'Multinationale',
  publique: 'Entreprise publique',
  privee: 'Entreprise privée',
  startup: 'Startup',
  pme: 'PME',
  cabinet: 'Cabinet',
  ong: 'ONG',
}

const companyTypeIcons = {
  multinationale: Globe,
  publique: Landmark,
  privee: Building2,
  startup: Rocket,
  pme: Building,
  cabinet: Briefcase,
  ong: Shield,
}

const companyTypeColors = {
  multinationale: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  publique: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  privee: 'bg-surface-100 text-surface-700 dark:bg-surface-600 dark:text-surface-400',
  startup: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  pme: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  cabinet: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  ong: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
}

const sizeLabels = {
  '1-10': '1-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201-500': '201-500',
  '501-1000': '501-1000',
  '1000+': '1000+',
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function FilterDropdown({ value, options, onChange, label, icon: Icon, labelMap }) {
  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-medium text-surface-500 dark:text-surface-400">
        {Icon && <Icon className="mr-1 inline h-3 w-3" />}
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-surface-200 bg-white py-2.5 pl-3 pr-10 text-sm font-medium text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300 dark:focus:border-primary-400"
        >
          <option value="">Tous</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {labelMap ? (labelMap[opt] || opt) : opt}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
      </div>
    </div>
  )
}

function getWebsiteUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

function getWebsiteDomain(url) {
  if (!url) return ''
  const full = getWebsiteUrl(url)
  try {
    return new URL(full).hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

function CopyEmailButton({ email }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = email
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [email])
  return (
    <button
      onClick={handleCopy}
      title="Copier l'email"
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
        copied
          ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400'
          : 'bg-primary-100 text-primary-600 hover:bg-primary-200 dark:bg-primary-500/15 dark:text-primary-400 dark:hover:bg-primary-500/25'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

function CompanyCard({ company, index }) {
  const TypeIcon = companyTypeIcons[company.companyType] || Building2
  const typeColor = companyTypeColors[company.companyType] || companyTypeColors.privee
  const typeLabel = companyTypeLabels[company.companyType] || company.companyType
  const websiteUrl = getWebsiteUrl(company.website)
  const websiteDomain = getWebsiteDomain(company.website)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-500/10">
          <TypeIcon className="h-6 w-6 text-primary-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-surface-900 group-hover:text-primary-600 dark:text-surface-50 dark:group-hover:text-primary-400">
            {company.companyName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${typeColor}`}>
              <TypeIcon className="h-3 w-3" />
              {typeLabel}
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {sizeLabels[company.companySize] || company.companySize} employés
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-2 rounded-xl bg-primary-50/70 px-3 py-2 dark:bg-primary-500/10">
          <MailCheck className="h-4 w-4 shrink-0 text-primary-500" />
          <a
            href={`mailto:${company.email}?subject=Candidature spontanée - EasyJob`}
            className="flex-1 truncate text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400"
          >
            {company.email}
          </a>
          <CopyEmailButton email={company.email} />
        </div>

        {company.phone && (
          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
            <Phone className="h-4 w-4 shrink-0 text-surface-400" />
            <a href={`tel:${company.phone}`} className="hover:text-primary-500 hover:underline">
              {company.phone}
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <Building2 className="h-4 w-4 shrink-0 text-surface-400" />
          <span>{company.sector}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
          <MapPin className="h-4 w-4 shrink-0 text-surface-400" />
          <span>{company.city}, {company.country}</span>
        </div>

        {websiteDomain && (
          <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
            <Globe className="h-4 w-4 shrink-0 text-surface-400" />
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary-500 hover:underline"
            >
              {websiteDomain}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {company.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
          {company.description}
        </p>
      )}

      <div className="mt-4 flex gap-2 border-t border-surface-100 pt-4 dark:border-surface-700">
        <a
          href={`mailto:${company.email}?subject=Candidature spontanée - EasyJob`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          <Mail className="h-4 w-4" />
          Envoyer un email
        </a>
        {company.website && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </motion.div>
  )
}

function CompanyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-4 w-28 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-4 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-4 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        <div className="h-4 w-36 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      </div>
    </div>
  )
}

export default function CompanyEmailsPage() {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState('')
  const [domain, setDomain] = useState('')
  const [companyType, setCompanyType] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)

  const apiFilters = useMemo(() => {
    const filters = { page, limit: 30 }
    if (search.trim()) filters.search = search.trim()
    if (sector) filters.sector = sector
    if (domain) filters.domain = domain
    if (companyType) filters.companyType = companyType
    if (companySize) filters.companySize = companySize
    if (city) filters.city = city
    return filters
  }, [search, sector, domain, companyType, companySize, city, page])

  const { data, isLoading } = useCompanyEmails(apiFilters)
  const { data: filtersData } = useCompanyEmailFilters()
  const companies = data?.companies ?? []
  const total = data?.total ?? 0

  const hasActiveFilters = sector || domain || companyType || companySize || city

  const clearFilters = () => {
    setSector('')
    setDomain('')
    setCompanyType('')
    setCompanySize('')
    setCity('')
    setPage(1)
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
            Annuaire d'entreprises
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Trouvez les emails des entreprises et recruteurs au Maroc
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters
                ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400'
                : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
          </button>
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
            placeholder="Rechercher par nom d'entreprise, email, secteur..."
            className="w-full rounded-2xl border border-surface-200 bg-white py-4 pl-12 pr-4 text-surface-700 shadow-sm transition-shadow placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-md dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200 dark:placeholder:text-surface-500 dark:focus:border-primary-400"
          />
        </div>
      </motion.div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <FilterDropdown
                value={sector}
                options={filtersData?.sectors || []}
                onChange={(v) => { setSector(v); setPage(1) }}
                label="Secteur"
                icon={Briefcase}
              />
              <FilterDropdown
                value={domain}
                options={filtersData?.domains || []}
                onChange={(v) => { setDomain(v); setPage(1) }}
                label="Domaine"
                icon={GraduationCap}
              />
              <FilterDropdown
                value={companyType}
                options={filtersData?.types || []}
                onChange={(v) => { setCompanyType(v); setPage(1) }}
                label="Type"
                icon={Factory}
                labelMap={companyTypeLabels}
              />
              <FilterDropdown
                value={companySize}
                options={filtersData?.sizes || []}
                onChange={(v) => { setCompanySize(v); setPage(1) }}
                label="Taille"
                icon={Users}
                labelMap={sizeLabels}
              />
              <FilterDropdown
                value={city}
                options={filtersData?.cities || []}
                onChange={(v) => { setCity(v); setPage(1) }}
                label="Ville"
                icon={MapPin}
              />
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-surface-200 px-3 py-1.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-300 dark:bg-surface-600 dark:text-surface-300 dark:hover:bg-surface-500"
                >
                  <X className="h-3 w-3" />
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <motion.div variants={item}>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          <span className="font-bold text-surface-900 dark:text-surface-100">
            {isLoading ? '...' : total}
          </span>{' '}
          {total === 1 ? 'entreprise trouvée' : 'entreprises trouvées'}
        </p>
      </motion.div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <CompanyCardSkeleton key={i} />
          ))}
        </div>
      ) : companies.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {companies.map((company, index) => (
              <CompanyCard key={company._id} company={company} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-16 dark:border-surface-600 dark:bg-surface-800/50"
        >
          <Building2 className="mb-4 h-12 w-12 text-surface-300 dark:text-surface-600" />
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">
            Aucune entreprise trouvée
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            Essayez de modifier vos filtres ou votre recherche
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-surface-200 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-300 dark:bg-surface-600 dark:text-surface-300 dark:hover:bg-surface-500"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser les filtres
            </button>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <motion.div variants={item} className="flex flex-col items-center gap-3">
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Page {page} sur {data.pages} — {total} entreprises
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-colors ${
                page === 1
                  ? 'cursor-not-allowed bg-surface-100 text-surface-300 dark:bg-surface-700 dark:text-surface-600'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Préc.
            </button>
            {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
              let pageNum
              if (data.pages <= 7) {
                pageNum = i + 1
              } else if (page <= 4) {
                pageNum = i + 1
              } else if (page >= data.pages - 3) {
                pageNum = data.pages - 6 + i
              } else {
                pageNum = page - 3 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                    pageNum === page
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(Math.min(data.pages, page + 1))}
              disabled={page === data.pages}
              className={`inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-colors ${
                page === data.pages
                  ? 'cursor-not-allowed bg-surface-100 text-surface-300 dark:bg-surface-700 dark:text-surface-600'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600'
              }`}
            >
              Suiv.
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
