import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Loader2,
  Briefcase,
  Globe,
  TreePine,
  Search,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Settings2,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useRunScraping, useScrapingLogs } from '@/api/hooks'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const initialPlatforms = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Briefcase,
    description: 'Offres d\'emploi professionnelles et réseau social',
    enabled: true,
    keywords: 'React, Node.js, TypeScript',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-500/10',
    lightText: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'indeed',
    name: 'Indeed',
    icon: Search,
    description: 'La plus grande plateforme de recherche d\'emploi',
    enabled: true,
    keywords: 'Full Stack, Frontend, Backend',
    color: 'bg-green-500',
    lightBg: 'bg-green-50 dark:bg-green-500/10',
    lightText: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'welcometothejungle',
    name: 'Welcome to the Jungle',
    icon: TreePine,
    description: 'Offres qualifiées dans la tech et l\'innovation',
    enabled: true,
    keywords: 'Tech, Startup, Innovation',
    color: 'bg-purple-500',
    lightBg: 'bg-purple-50 dark:bg-purple-500/10',
    lightText: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'rekrute',
    name: 'Rekrute',
    icon: Users,
    description: 'Plateforme marocaine de recrutement spécialisé',
    enabled: true,
    keywords: 'CDI, Ingénieur, Chef de projet',
    color: 'bg-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-500/10',
    lightText: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'manpower',
    name: 'Manpower',
    icon: Globe,
    description: 'Recrutement et solutions de travail temporaire',
    enabled: false,
    keywords: 'Intérim, Contractuel, Cadre',
    color: 'bg-red-500',
    lightBg: 'bg-red-50 dark:bg-red-500/10',
    lightText: 'text-red-600 dark:text-red-400',
  },
]

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 dark:focus:ring-offset-surface-800"
      style={{
        backgroundColor: enabled
          ? '#2563EB'
          : 'var(--toggle-bg, #D1D5DB)',
      }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        style={{
          marginLeft: enabled ? '22px' : '2px',
        }}
      />
    </button>
  )
}

export default function ScrapingConfigPage() {
  const navigate = useNavigate()
  const [platforms, setPlatforms] = useState(initialPlatforms)
  const [autoEnabled, setAutoEnabled] = useState(true)
  const [frequency, setFrequency] = useState('quotidien')
  const [scrapeTime, setScrapeTime] = useState('22:00')

  const runScraping = useRunScraping()
  const { data: logsData, isLoading: logsLoading } = useScrapingLogs()
  const historyEntries = logsData?.logs ?? []

  const handleScrape = () => {
    const enabledSources = platforms.filter(p => p.enabled).map(p => p.id)
    const allKeywords = platforms.filter(p => p.enabled).flatMap(p => p.keywords.split(',').map(k => k.trim()).filter(Boolean))
    
    runScraping.mutate(
      { keywords: allKeywords.length > 0 ? allKeywords : undefined, sources: enabledSources.length > 0 ? enabledSources : undefined },
      {
        onSuccess: (data) => {
          toast.success(`Scrapping terminé ! ${data?.jobsFound ?? 0} nouvelles offres trouvées`, { duration: 4000 })
        },
        onError: (err) => {
          toast.error(err?.response?.data?.error || err?.message || 'Erreur lors du scrapping')
        },
      }
    )
  }

  const togglePlatform = (id) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const updateKeywords = (id, keywords) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, keywords } : p))
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
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

      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Configuration du Scrapping
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Collectez jusqu'à 100 offres d'emploi par lancement
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleScrape}
          disabled={runScraping.isPending}
          className="inline-flex items-center gap-2.5 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          {runScraping.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          {runScraping.isPending ? 'Scrapping en cours...' : 'Lancer maintenant'}
        </motion.button>
      </motion.div>

      {/* Platform Cards */}
      <motion.div variants={item}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-900 dark:text-surface-50">
          <Settings2 className="h-5 w-5 text-primary-500" />
          Sources configurées
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const Icon = platform.icon
            return (
              <motion.div
                key={platform.id}
                variants={item}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-surface-800 ${
                  platform.enabled
                    ? 'border-surface-200 hover:shadow-md dark:border-surface-700'
                    : 'border-surface-100 opacity-60 dark:border-surface-700/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ${platform.lightBg}`}>
                      <Icon className={`h-5 w-5 ${platform.lightText}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                        {platform.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={platform.enabled}
                    onToggle={() => togglePlatform(platform.id)}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
                      Mots-clés personnalisés
                    </label>
                    <input
                      type="text"
                      value={platform.keywords}
                      onChange={(e) => updateKeywords(platform.id, e.target.value)}
                      placeholder="Ex: React, Node.js..."
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 transition-colors placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700/50 dark:text-surface-200 dark:placeholder:text-surface-500 dark:focus:border-primary-400"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
                    <Clock className="h-3 w-3" />
                    Dernier scrapping :
                    <span className="font-medium text-surface-600 dark:text-surface-300">
                      Jamais
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Scraping History */}
      <motion.div variants={item}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-900 dark:text-surface-50">
          <Clock className="h-5 w-5 text-accent-500" />
          Historique des scrappings
        </h2>
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-800">
          {logsLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                  <div className="h-4 w-16 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                  <div className="h-4 w-8 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
                </div>
              ))}
            </div>
          ) : historyEntries.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50 dark:border-surface-700 dark:bg-surface-700/50">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                        Durée
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                        Offres trouvées
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                    {historyEntries.map((entry, index) => {
                      const duration = entry.duration || (entry.startedAt && entry.completedAt
                        ? `${Math.round((new Date(entry.completedAt) - new Date(entry.startedAt)) / 1000)}s`
                        : '—')
                      return (
                      <motion.tr
                        key={entry._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="transition-colors hover:bg-surface-50 dark:hover:bg-surface-700/30"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-surface-700 dark:text-surface-300">
                          {new Date(entry.startedAt || entry.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                          {duration}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-surface-900 dark:text-surface-100">
                          {entry.totalOffersFound ?? entry.offersFound ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {entry.status === 'success' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Succès
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                              <XCircle className="h-3 w-3" />
                              Échec
                            </span>
                          )}
                        </td>
                      </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-surface-100 dark:divide-surface-700">
                {historyEntries.map((entry, index) => {
                  const duration = entry.duration || (entry.startedAt && entry.completedAt
                    ? `${Math.round((new Date(entry.completedAt) - new Date(entry.startedAt)) / 1000)}s`
                    : '—')
                  return (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                          {new Date(entry.startedAt || entry.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                          Durée : {duration}
                        </p>
                      </div>
                      {entry.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-0.5 text-xs font-semibold text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Succès
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                          <XCircle className="h-3 w-3" />
                          Échec
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                      <span className="font-bold text-surface-900 dark:text-surface-100">
                        {entry.totalOffersFound ?? entry.offersFound ?? 0}
                      </span>{' '}
                      offres trouvées
                    </p>
                  </motion.div>
                  )})}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-3 h-10 w-10 text-surface-300 dark:text-surface-600" />
              <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">
                Aucun historique
              </h3>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Lancez un scrapping pour voir l'historique ici.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Auto-Scraping Settings */}
      <motion.div variants={item}>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-surface-900 dark:text-surface-50">
          <Zap className="h-5 w-5 text-secondary-500" />
          Paramètres automatiques
        </h2>
        <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-secondary-50 p-3 dark:bg-secondary-500/10">
                <Zap className="h-5 w-5 text-secondary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                  Scrapping automatique
                </h3>
                <p className="mt-0.5 text-sm text-surface-500 dark:text-surface-400">
                  Collecte automatique des nouvelles offres
                </p>
              </div>
            </div>
            <Toggle enabled={autoEnabled} onToggle={() => setAutoEnabled(!autoEnabled)} />
          </div>

          {autoEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 grid grid-cols-1 gap-4 border-t border-surface-100 pt-6 dark:border-surface-700 sm:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Fréquence
                </label>
                <div className="relative">
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700/50 dark:text-surface-200 dark:focus:border-primary-400"
                  >
                    <option value="quotidien">Quotidien</option>
                    <option value="hebdomadaire">Hebdomadaire</option>
                    <option value="manuel">Manuel</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Heure d'exécution
                </label>
                <div className="relative">
                  <select
                    value={scrapeTime}
                    onChange={(e) => setScrapeTime(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700/50 dark:text-surface-200 dark:focus:border-primary-400"
                  >
                    <option value="06:00">06:00</option>
                    <option value="08:00">08:00</option>
                    <option value="10:00">10:00</option>
                    <option value="12:00">12:00</option>
                    <option value="14:00">14:00</option>
                    <option value="16:00">16:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00</option>
                    <option value="22:00">22:00</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
