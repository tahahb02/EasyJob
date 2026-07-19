import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, CheckCircle, XCircle, Clock, Eye, ChevronDown } from 'lucide-react'
import { useRecruiterApplications, useUpdateRecruiterApplicationStatus } from '@/api/hooks'
import toast from 'react-hot-toast'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const statusConfig = {
  envoyee: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText },
  ouverte: { label: 'Ouverte', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Eye },
  en_cours: { label: 'En cours', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Clock },
  acceptee: { label: 'Acceptée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  refusee: { label: 'Refusée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

export default function RecruiterApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [jobFilter] = useState('')
  const updateStatus = useUpdateRecruiterApplicationStatus()
  const { data: appsData, isLoading: appsLoading } = useRecruiterApplications({
    status: statusFilter || undefined,
    jobId: jobFilter || undefined,
  })

  const applications = appsData?.applications || []

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateStatus.mutateAsync({ id: appId, status: newStatus })
      toast.success('Statut mis à jour')
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  if (appsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-surface-800 dark:text-white">Candidatures reçues</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Gérez les candidatures pour vos offres</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-800 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statusConfig).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <motion.div variants={item} className="text-center py-12 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800">
          <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">Aucune candidature reçue</p>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-3">
          {applications.map((app) => {
            const candidate = app.userId
            const job = app.jobOfferId
            const statusInfo = statusConfig[app.status] || { label: app.status, color: 'bg-gray-100 text-gray-600', icon: FileText }

            return (
              <div key={app._id} className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary-600">
                        {candidate?.firstName?.[0]}{candidate?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-surface-800 dark:text-white text-sm">
                          {candidate?.firstName} {candidate?.lastName}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-surface-500 mt-0.5">{candidate?.email}</p>
                      {job && (
                        <p className="text-xs text-surface-400 mt-1">
                          Postulé pour : <span className="font-medium text-surface-600 dark:text-surface-300">{job.title}</span> - {job.company}
                        </p>
                      )}
                      {app.coverLetter && (
                        <p className="text-sm text-surface-500 mt-2 line-clamp-2 italic">"{app.coverLetter.slice(0, 150)}..."</p>
                      )}
                      <p className="text-xs text-surface-400 mt-2">
                        Postulé le {new Date(app.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 py-2 text-sm border border-surface-200 dark:border-surface-700 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition">
                        Actions <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(app._id, key)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-700 transition ${
                              app.status === key ? 'font-semibold text-primary-500' : 'text-surface-600 dark:text-surface-400'
                            }`}
                          >
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
