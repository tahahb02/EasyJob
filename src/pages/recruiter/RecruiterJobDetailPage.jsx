import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Users, Briefcase, Loader2,
  Trash2, Eye, EyeOff, Calendar, DollarSign
} from 'lucide-react'
import { useRecruiterJob, useDeleteRecruiterJob, useToggleRecruiterJob, useUpdateRecruiterApplicationStatus } from '@/api/hooks'
import toast from 'react-hot-toast'

const statusColors = {
  envoyee: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ouverte: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  en_cours: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  acceptee: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  refusee: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
const statusLabels = {
  envoyee: 'Envoyée', ouverte: 'Ouverte', en_cours: 'En cours', acceptee: 'Acceptée', refusee: 'Refusée',
}

export default function RecruiterJobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useRecruiterJob(id)
  const deleteJob = useDeleteRecruiterJob()
  const toggleJob = useToggleRecruiterJob()
  const updateAppStatus = useUpdateRecruiterApplicationStatus()

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  }

  const job = data?.job
  const applications = data?.applications || []

  if (!job) return <p className="text-center text-surface-500 py-12">Offre non trouvée</p>

  const handleDelete = async () => {
    if (!confirm('Supprimer cette offre ?')) return
    await deleteJob.mutateAsync(id)
    toast.success('Offre supprimée')
    navigate('/recruiter-space/jobs')
  }

  const handleStatusChange = async (appId, status) => {
    await updateAppStatus.mutateAsync({ id: appId, status })
    toast.success('Statut mis à jour')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:hover:text-white transition">
        <ArrowLeft className="w-5 h-5" /> Retour
      </button>

      {/* Job Info */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-surface-800 dark:text-white">{job.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-surface-500 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.contractType}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {applications.length} candidatures</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
              {job.salary?.min > 0 && (
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary.min.toLocaleString()} - {job.salary.max?.toLocaleString()} MAD</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => toggleJob.mutateAsync(id)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition" title={job.isActive ? 'Désactiver' : 'Activer'}>
              {job.isActive ? <EyeOff className="w-5 h-5 text-surface-500" /> : <Eye className="w-5 h-5 text-green-500" />}
            </button>
            <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-500/10 transition" title="Supprimer">
              <Trash2 className="w-5 h-5 text-danger-500" />
            </button>
          </div>
        </div>
        {job.description && (
          <p className="mt-4 text-surface-600 dark:text-surface-400 text-sm whitespace-pre-line">{job.description}</p>
        )}
        {job.requirements?.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-surface-700 dark:text-surface-300 text-sm mb-2">Prérequis</h3>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((r, i) => (
                <span key={i} className="px-3 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 rounded-full text-xs">{r}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Matching Candidates */}
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-surface-800 dark:text-white mb-4">Candidatures ({applications.length})</h2>
        {applications.length === 0 ? (
          <p className="text-surface-500 text-center py-8">Aucune candidature pour le moment</p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const candidate = app.userId
              return (
                <div key={app._id} className="flex items-center justify-between p-4 rounded-xl border border-surface-100 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-600">{candidate?.firstName?.[0]}{candidate?.lastName?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-surface-800 dark:text-white text-sm">{candidate?.firstName} {candidate?.lastName}</p>
                      <p className="text-xs text-surface-500">{candidate?.email}</p>
                      {app.matchScore > 0 && (
                        <p className="text-xs text-primary-500 font-medium mt-0.5">Score de match : {app.matchScore}%</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[app.status] || ''}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
