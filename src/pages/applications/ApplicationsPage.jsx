import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  FileEdit,
  Clock,
  CheckCircle2,
  Trash2,
  Eye,
  Inbox,
  Mail,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { useApplications, useDeleteApplication } from '@/api/hooks'
import toast from 'react-hot-toast'

const statusConfig = {
  brouillon: {
    label: 'Brouillon',
    color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400',
    dot: 'bg-surface-400',
    tab: 'Brouillons',
  },
  envoyee: {
    label: 'Envoyée',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    dot: 'bg-blue-500',
    tab: 'Envoyées',
  },
  ouverte: {
    label: 'Ouverte',
    color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    dot: 'bg-green-500',
    tab: 'En cours',
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    tab: 'En cours',
  },
  acceptee: {
    label: 'Acceptée',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    tab: 'Acceptées',
  },
  refusee: {
    label: 'Refusée',
    color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    dot: 'bg-red-500',
    tab: 'Refusées',
  },
}

const tabs = [
  { key: 'all', label: 'Toutes' },
  { key: 'brouillon', label: 'Brouillons' },
  { key: 'envoyee', label: 'Envoyées' },
  { key: 'en_cours_group', label: 'En cours' },
  { key: 'acceptee', label: 'Acceptées' },
  { key: 'refusee', label: 'Refusées' },
]

const tabToStatus = {
  brouillon: 'brouillon',
  envoyee: 'envoyee',
  en_cours_group: 'en_cours',
  acceptee: 'acceptee',
  refusee: 'refusee',
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

function ApplicationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-surface-200 dark:bg-surface-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          </div>
          <div className="h-6 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="h-4 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
        </div>
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
        <div className="h-7 w-8 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      </div>
      <div className="mt-3 h-4 w-20 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
    </div>
  )
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [page, setPage] = useState(1)

  const apiFilters = useMemo(() => {
    const filters = { page, limit: 20 }
    if (activeTab !== 'all' && activeTab !== 'en_cours_group') {
      filters.status = tabToStatus[activeTab]
    }
    return filters
  }, [activeTab, page])

  const { data, isLoading, error, refetch } = useApplications(apiFilters)
  const deleteApp = useDeleteApplication()

  const applications = data?.applications ?? []
  const total = data?.total ?? 0

  const stats = useMemo(() => {
    const allApps = applications
    return {
      brouillons: allApps.filter((a) => a.status === 'brouillon').length,
      envoyees: allApps.filter((a) => a.status === 'envoyee').length,
      enCours: allApps.filter((a) => a.status === 'en_cours' || a.status === 'ouverte').length,
      acceptees: allApps.filter((a) => a.status === 'acceptee').length,
    }
  }, [applications])

  const filteredApplications = useMemo(() => {
    if (activeTab === 'all') return applications
    if (activeTab === 'en_cours_group') {
      return applications.filter((a) => a.status === 'en_cours' || a.status === 'ouverte')
    }
    return applications.filter((a) => a.status === activeTab)
  }, [applications, activeTab])

  const sortedApplications = useMemo(() => {
    return [...filteredApplications].sort((a, b) => {
      const aTime = a.email?.sentAt || a.updatedAt
      const bTime = b.email?.sentAt || b.updatedAt
      if (!aTime && !bTime) return 0
      if (!aTime) return 1
      if (!bTime) return -1
      return new Date(bTime) - new Date(aTime)
    })
  }, [filteredApplications])

  const handleDelete = (id) => {
    deleteApp.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null)
        toast.success('Candidature supprimée')
      },
      onError: () => {
        toast.error('Erreur lors de la suppression')
      },
    })
  }

  const miniStats = [
    {
      label: 'Brouillons',
      count: stats.brouillons,
      icon: FileEdit,
      iconBg: 'bg-surface-100 dark:bg-surface-700',
      iconColor: 'text-surface-500 dark:text-surface-400',
      valueColor: 'text-surface-700 dark:text-surface-300',
    },
    {
      label: 'Envoyées',
      count: stats.envoyees,
      icon: Send,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'En cours',
      count: stats.enCours,
      icon: Clock,
      iconBg: 'bg-yellow-50 dark:bg-yellow-500/10',
      iconColor: 'text-yellow-500',
      valueColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Acceptées',
      count: stats.acceptees,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ]

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
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            Mes Candidatures
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez et suivez l'état de toutes vos candidatures
          </p>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : miniStats.map((stat) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  variants={item}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
                >
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl p-2.5 ${stat.iconBg}`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                    <span className={`text-2xl font-bold ${stat.valueColor}`}>
                      {stat.count}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-surface-500 dark:text-surface-400">
                    {stat.label}
                  </p>
                </motion.div>
              )
            })}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-surface-200 bg-white p-1.5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1) }}
            className={`relative whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-500/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Results Count */}
      <motion.div variants={item}>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          <span className="font-bold text-surface-900 dark:text-surface-100">
            {isLoading ? '...' : total}
          </span>{' '}
          {total === 1 ? 'candidature' : 'candidatures'}
        </p>
      </motion.div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedApplications.length > 0 ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {sortedApplications.map((application) => {
              const status = statusConfig[application.status] || statusConfig.brouillon
              return (
                <motion.div
                  key={application.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        {application.email?.sentAt && (
                          <span className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(application.email.sentAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2.5 text-lg font-bold text-surface-900 group-hover:text-primary-600 dark:text-surface-50 dark:group-hover:text-primary-400">
                        {application.jobOfferId?.title || 'Offre inconnue'}
                      </h3>

                      <p className="mt-0.5 text-sm font-medium text-surface-500 dark:text-surface-400">
                        {application.jobOfferId?.company || ''}
                      </p>

                      {application.email?.subject && (
                        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-surface-400 dark:text-surface-500" />
                          <p className="truncate text-sm text-surface-500 dark:text-surface-400">
                            {application.email.subject}
                          </p>
                        </div>
                      )}

                      {application.notes && (
                        <p className="mt-2.5 line-clamp-1 text-sm text-surface-400 dark:text-surface-500 italic">
                          {application.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {application.status === 'brouillon' ? (
                        <Link
                          to={`/applications/compose/${application.jobOfferId?.id || application.jobOfferId?._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Reprendre</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/applications/compose/${application.jobOfferId?.id || application.jobOfferId?._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Voir</span>
                        </Link>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setDeleteConfirm(deleteConfirm === application.id ? null : application.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2.5 text-sm font-medium text-surface-500 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 dark:border-surface-600 dark:text-surface-400 dark:hover:border-danger-500/30 dark:hover:bg-danger-500/10 dark:hover:text-danger-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                          {deleteConfirm === application.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -5 }}
                              className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-surface-200 bg-white p-3 shadow-lg dark:border-surface-700 dark:bg-surface-800"
                            >
                              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                Supprimer cette candidature ?
                              </p>
                              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                                Cette action est irréversible.
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={() => handleDelete(application.id)}
                                  disabled={deleteApp.isPending}
                                  className="flex-1 rounded-lg bg-danger-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-danger-600 disabled:opacity-60"
                                >
                                  {deleteApp.isPending ? '...' : 'Supprimer'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-20 dark:border-surface-600 dark:bg-surface-800/50"
        >
          <div className="rounded-full bg-surface-100 p-5 dark:bg-surface-700">
            <Inbox className="h-10 w-10 text-surface-400 dark:text-surface-500" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-surface-700 dark:text-surface-300">
            Aucune candidature
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {activeTab === 'all'
              ? "Vous n'avez pas encore de candidatures. Commencez par postuler !"
              : "Aucune candidature ne correspond à ce filtre."}
          </p>
          {activeTab === 'all' && (
            <Link
              to="/jobs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Explorer les offres
            </Link>
          )}
        </motion.div>
      )}

      {/* Pagination */}
      {data?.pages > 1 && (
        <motion.div variants={item} className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 disabled:opacity-40 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm font-medium text-surface-500 dark:text-surface-400">
            Page {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 disabled:opacity-40 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            Suivant
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
