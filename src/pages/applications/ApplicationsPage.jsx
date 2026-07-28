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
  Briefcase,
  Building2,
  UserCheck,
  MapPin,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { useApplications, useDeleteApplication } from '@/api/hooks'
import toast from 'react-hot-toast'

const sourceTabs = [
  { key: 'external', label: 'Externes', icon: Briefcase },
  { key: 'internal', label: 'Internes', icon: Building2 },
]

const statusConfig = {
  brouillon: { label: 'Brouillon', color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400', dot: 'bg-surface-400' },
  envoyee: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', dot: 'bg-blue-500' },
  consulte: { label: 'Consultée', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', dot: 'bg-yellow-500' },
  valide_entretien: { label: 'Entretien validé', color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', dot: 'bg-green-500' },
  appel_attente: { label: 'Appel en attente', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400', dot: 'bg-purple-500' },
  entretien_fait: { label: 'Entretien fait', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400', dot: 'bg-indigo-500' },
  accepte_final: { label: 'Acceptée', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', dot: 'bg-emerald-500' },
  refusee: { label: 'Refusée', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400', dot: 'bg-red-500' },
}

const filterTabs = [
  { key: 'all', label: 'Toutes' },
  { key: 'brouillon', label: 'Brouillons' },
  { key: 'envoyee', label: 'Envoyées' },
  { key: 'en_cours_group', label: 'En cours' },
  { key: 'accepte_final', label: 'Acceptées' },
  { key: 'refusee', label: 'Refusées' },
]

const filterStatuses = {
  brouillon: ['brouillon'],
  envoyee: ['envoyee'],
  en_cours_group: ['consulte', 'valide_entretien', 'appel_attente', 'entretien_fait'],
  accepte_final: ['accepte_final'],
  refusee: ['refusee'],
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function Skeleton() {
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
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, count, iconBg, iconColor, valueColor }) {
  return (
    <motion.div variants={item} whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
    >
      <div className="flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className={`text-2xl font-bold ${valueColor}`}>{count}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-surface-500 dark:text-surface-400">{label}</p>
    </motion.div>
  )
}

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const [sourceTab, setSourceTab] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useApplications({ page, limit: 100 })
  const deleteApp = useDeleteApplication()

  const applications = data?.applications ?? []

  const filteredBySource = useMemo(() => {
    if (sourceTab === 'all') return applications
    if (sourceTab === 'internal') {
      return applications.filter(a => a.jobOfferId?.source === 'recruiter')
    }
    return applications.filter(a => a.jobOfferId?.source !== 'recruiter')
  }, [applications, sourceTab])

  const filteredApps = useMemo(() => {
    if (activeFilter === 'all') return filteredBySource
    const statuses = filterStatuses[activeFilter]
    if (!statuses) return filteredBySource
    return filteredBySource.filter(a => statuses.includes(a.status))
  }, [filteredBySource, activeFilter])

  const sortedApps = useMemo(() => {
    return [...filteredApps].sort((a, b) => {
      const aTime = a.email?.sentAt || a.appliedAt || a.updatedAt
      const bTime = b.email?.sentAt || b.appliedAt || b.updatedAt
      if (!aTime && !bTime) return 0
      if (!aTime) return 1
      if (!bTime) return -1
      return new Date(bTime) - new Date(aTime)
    })
  }, [filteredApps])

  const stats = useMemo(() => {
    const a = filteredBySource
    return {
      brouillons: a.filter(x => x.status === 'brouillon').length,
      envoyees: a.filter(x => x.status === 'envoyee').length,
      enCours: a.filter(x => ['consulte', 'valide_entretien', 'appel_attente', 'entretien_fait'].includes(x.status)).length,
      acceptees: a.filter(x => x.status === 'accepte_final').length,
    }
  }, [filteredBySource])

  const handleDelete = (id) => {
    deleteApp.mutate(id, {
      onSuccess: () => { setDeleteConfirm(null); toast.success('Candidature supprimée') },
      onError: () => toast.error('Erreur lors de la suppression'),
    })
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-danger-300 bg-danger-50 py-12 dark:border-danger-500/30 dark:bg-danger-500/5">
          <AlertTriangle className="mb-3 h-10 w-10 text-danger-400" />
          <h3 className="text-lg font-semibold text-danger-700 dark:text-danger-400">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-danger-500">{error?.message || 'Une erreur est survenue.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-600">Réessayer</button>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">Mes Candidatures</h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            {sourceTab === 'all' ? 'Toutes vos candidatures' :
             sourceTab === 'internal' ? 'Candidatures aux offres internes' :
             'Candidatures aux offres externes'}
          </p>
        </div>
        <Link to="/jobs"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          <Briefcase className="h-4 w-4" />
          Voir les offres
        </Link>
      </motion.div>

      {/* Source Tabs */}
      <motion.div variants={item} className="flex gap-1 rounded-2xl border border-surface-200 bg-white p-1.5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <button
          onClick={() => { setSourceTab('all'); setActiveFilter('all'); setPage(1) }}
          className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
            sourceTab === 'all' ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
          }`}
        >
          {sourceTab === 'all' && (
            <motion.div layoutId="appSourceTab" className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-500/10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
          )}
          <span className="relative z-10">Toutes</span>
        </button>
        {sourceTabs.map(tab => {
          const Icon = tab.icon
          const isActive = sourceTab === tab.key
          return (
            <button key={tab.key}
              onClick={() => { setSourceTab(tab.key); setActiveFilter('all'); setPage(1) }}
              className={`relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              {isActive && (
                <motion.div layoutId="appSourceTab" className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-500/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />) : (
          <>
            <StatCard icon={FileEdit} label="Brouillons" count={stats.brouillons}
              iconBg="bg-surface-100 dark:bg-surface-700" iconColor="text-surface-500 dark:text-surface-400" valueColor="text-surface-700 dark:text-surface-300" />
            <StatCard icon={Send} label="Envoyées" count={stats.envoyees}
              iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-500" valueColor="text-blue-600 dark:text-blue-400" />
            <StatCard icon={Clock} label="En cours" count={stats.enCours}
              iconBg="bg-yellow-50 dark:bg-yellow-500/10" iconColor="text-yellow-500" valueColor="text-yellow-600 dark:text-yellow-400" />
            <StatCard icon={CheckCircle2} label="Acceptées" count={stats.acceptees}
              iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-500" valueColor="text-emerald-600 dark:text-emerald-400" />
          </>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-surface-200 bg-white p-1.5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        {filterTabs.map(tab => (
          <button key={tab.key}
            onClick={() => { setActiveFilter(tab.key); setPage(1) }}
            className={`relative whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeFilter === tab.key ? 'text-primary-600 dark:text-primary-400' : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
            }`}
          >
            {activeFilter === tab.key && (
              <motion.div layoutId="appFilterTab" className="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-500/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Count */}
      <motion.div variants={item}>
        <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
          <span className="font-bold text-surface-900 dark:text-surface-100">{isLoading ? '...' : filteredBySource.length}</span>{' '}
          {filteredBySource.length === 1 ? 'candidature' : 'candidatures'}
          {sourceTab !== 'all' && (
            <span className="ml-1 text-surface-400">
              ({sourceTab === 'internal' ? 'internes' : 'externes'})
            </span>
          )}
        </p>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : sortedApps.length > 0 ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedApps.map(app => {
              const status = statusConfig[app.status] || statusConfig.brouillon
              const isInternal = app.jobOfferId?.source === 'recruiter'
              return (
                <motion.div key={app.id} layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        {isInternal ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] font-semibold text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400">
                            <Building2 className="h-3 w-3" />
                            Recruteur
                          </span>
                        ) : app.jobOfferId?.source && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                            <Briefcase className="h-3 w-3" />
                            Externe
                          </span>
                        )}
                        {app.email?.sentAt && (
                          <span className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(app.email.sentAt), { addSuffix: true, locale: fr })}
                          </span>
                        )}
                        {app.appliedAt && !app.email?.sentAt && (
                          <span className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true, locale: fr })}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2.5 text-lg font-bold text-surface-900 group-hover:text-primary-600 dark:text-surface-50 dark:group-hover:text-primary-400">
                        {app.jobOfferId?.title || 'Offre inconnue'}
                      </h3>
                      <p className="mt-0.5 text-sm font-medium text-surface-500 dark:text-surface-400">
                        {app.jobOfferId?.company || ''}
                      </p>

                      {app.jobOfferId?.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-surface-400 dark:text-surface-500">
                          <MapPin className="h-3 w-3" />
                          {app.jobOfferId.location}
                        </p>
                      )}

                      {app.email?.subject && (
                        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-surface-400 dark:text-surface-500" />
                          <p className="truncate text-sm text-surface-500 dark:text-surface-400">{app.email.subject}</p>
                        </div>
                      )}

                      {app.statusHistory && app.statusHistory.length > 1 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-primary-500 hover:text-primary-600">
                            Historique ({app.statusHistory.length})
                          </summary>
                          <div className="mt-1.5 space-y-1">
                            {app.statusHistory.map((entry, i) => {
                              const s = statusConfig[entry.status] || statusConfig.brouillon
                              return (
                                <div key={i} className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                                  <span className="font-medium">{s.label}</span>
                                  <span>— {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true, locale: fr })}</span>
                                </div>
                              )
                            })}
                          </div>
                        </details>
                      )}

                      {app.notes && (
                        <p className="mt-2.5 line-clamp-1 text-sm text-surface-400 dark:text-surface-500 italic">{app.notes}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {!isInternal && app.status === 'brouillon' ? (
                        <Link to={`/applications/compose/${app.jobOfferId?.id || app.jobOfferId?._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Reprendre</span>
                        </Link>
                      ) : isInternal && app.status !== 'brouillon' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-600 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-400">
                          <UserCheck className="h-4 w-4" />
                          <span className="hidden sm:inline">Suivi</span>
                        </span>
                      ) : (
                        !isInternal && (
                          <Link to={`/applications/compose/${app.jobOfferId?.id || app.jobOfferId?._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Voir</span>
                          </Link>
                        )
                      )}

                      <div className="relative">
                        <button onClick={() => setDeleteConfirm(deleteConfirm === app.id ? null : app.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-3 py-2.5 text-sm font-medium text-surface-500 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 dark:border-surface-600 dark:text-surface-400 dark:hover:border-danger-500/30 dark:hover:bg-danger-500/10 dark:hover:text-danger-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                          {deleteConfirm === app.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -5 }}
                              className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-surface-200 bg-white p-3 shadow-lg dark:border-surface-700 dark:bg-surface-800"
                            >
                              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">Supprimer cette candidature ?</p>
                              <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">Cette action est irréversible.</p>
                              <div className="mt-3 flex items-center gap-2">
                                <button onClick={() => setDeleteConfirm(null)}
                                  className="flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700">
                                  Annuler
                                </button>
                                <button onClick={() => handleDelete(app.id)} disabled={deleteApp.isPending}
                                  className="flex-1 rounded-lg bg-danger-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-danger-600 disabled:opacity-60">
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
        <motion.div variants={item} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 py-20 dark:border-surface-600 dark:bg-surface-800/50">
          <div className="rounded-full bg-surface-100 p-5 dark:bg-surface-700">
            <Inbox className="h-10 w-10 text-surface-400 dark:text-surface-500" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-surface-700 dark:text-surface-300">
            {sourceTab === 'internal' ? 'Aucune candidature interne' : 'Aucune candidature'}
          </h3>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {sourceTab === 'internal'
              ? 'Postulez aux offres internes pour les voir apparaître ici'
              : activeFilter === 'all'
                ? "Vous n'avez pas encore de candidatures. Commencez par postuler !"
                : "Aucune candidature ne correspond à ce filtre."}
          </p>
          {activeFilter === 'all' && (
            <Link to="/jobs"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Explorer les offres
            </Link>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
