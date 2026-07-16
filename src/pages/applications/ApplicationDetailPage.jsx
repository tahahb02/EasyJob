import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileEdit,
  Send,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  StickyNote,
  Bell,
  RefreshCw,
  PenLine,
  User,
  Building2,
  Calendar,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

import { useApplication, useUpdateApplicationNotes } from '@/api/hooks'
import toast from 'react-hot-toast'

const statusConfig = {
  brouillon: {
    label: 'Brouillon',
    color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400',
    dot: 'bg-surface-400',
    icon: FileEdit,
  },
  envoyee: {
    label: 'Envoyée',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    dot: 'bg-blue-500',
    icon: Send,
  },
  ouverte: {
    label: 'Ouverte',
    color: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
    dot: 'bg-green-500',
    icon: Eye,
  },
  en_cours: {
    label: 'En cours',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
    dot: 'bg-yellow-500',
    icon: Clock,
  },
  acceptee: {
    label: 'Acceptée',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  refusee: {
    label: 'Refusée',
    color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
    dot: 'bg-red-500',
    icon: XCircle,
  },
}

const timelineSteps = [
  { key: 'brouillon', label: 'Brouillon', icon: FileEdit },
  { key: 'envoyee', label: 'Envoyée', icon: Send },
  { key: 'ouverte', label: 'Ouverte', icon: Eye },
  { key: 'en_cours', label: 'En cours', icon: Clock },
  { key: 'acceptee', label: 'Acceptée', icon: CheckCircle2 },
]

const statusOrder = ['brouillon', 'envoyee', 'ouverte', 'en_cours', 'acceptee', 'refusee']

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

function TimelineStep({ step, index, isCompleted, isCurrent, isFailed }) {
  const Icon = step.icon

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
          className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
            isCompleted
              ? 'border-secondary-500 bg-secondary-500 text-white'
              : isCurrent
              ? 'border-primary-500 bg-primary-500 text-white'
              : isFailed
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-surface-300 bg-white text-surface-400 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-500'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : isFailed ? (
            <XCircle className="h-5 w-5" />
          ) : isCurrent ? (
            <Clock className="h-5 w-5" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {isCurrent && (
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-2 border-primary-500"
            />
          )}
        </motion.div>
        {index < timelineSteps.length - 1 && (
          <div
            className={`w-0.5 flex-1 ${
              isCompleted
                ? 'bg-secondary-500'
                : 'bg-surface-200 dark:bg-surface-700'
            }`}
          />
        )}
      </div>

      <div className="pb-8 pt-2">
        <p
          className={`text-sm font-semibold ${
            isCompleted
              ? 'text-secondary-600 dark:text-secondary-400'
              : isCurrent
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-surface-400 dark:text-surface-500'
          }`}
        >
          {step.label}
        </p>
        {step.date && (
          <p className="mt-0.5 text-xs text-surface-400 dark:text-surface-500">
            {format(new Date(step.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
        )}
        {step.description && (
          <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
            {step.description}
          </p>
        )}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800 sm:p-8">
        <div className="space-y-4">
          <div className="h-8 w-64 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          <div className="flex gap-4">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
            <div className="h-5 w-24 animate-pulse rounded bg-surface-200 dark:bg-surface-700" />
          </div>
          <div className="flex gap-3 pt-4 border-t border-surface-100 dark:border-surface-700">
            <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-80 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
          <div className="h-40 animate-pulse rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-800" />
        </div>
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  const { data, isLoading, error } = useApplication(id)
  const application = data?.application
  const updateNotesMutation = useUpdateApplicationNotes()

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !application) {
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
            <FileEdit className="mb-4 h-16 w-16 text-surface-300 dark:text-surface-600" />
          )}
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            {error ? 'Erreur de chargement' : 'Candidature non trouvée'}
          </h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            {error ? error.message : "Cette candidature n'existe pas ou a été supprimée."}
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux candidatures
          </button>
        </motion.div>
      </div>
    )
  }

  const status = statusConfig[application.status] || statusConfig.brouillon
  const StatusIcon = status.icon

  const timeline = application.timeline || []

  const email = application.email || null

  const currentStepIndex = timelineSteps.findIndex(
    (s) => s.key === application.status
  )

  const handleFollow = () => {
    toast.success('Candidature suivie', { icon: '👁️' })
  }

  const handleRelance = () => {
    toast.success('Email de relance préparé', { icon: '📧' })
  }

  const handleEdit = () => {
    const jobId = application.jobOfferId?.id || application.jobOfferId?._id || application.jobOfferId
    navigate(`/applications/compose/${jobId}`)
  }

  const handleSaveNotes = () => {
    const notesToSave = notes || application.notes || ''
    updateNotesMutation.mutate(
      { id: application._id || application.id, notes: notesToSave },
      {
        onSuccess: () => {
          setIsEditingNotes(false)
          toast.success('Notes sauvegardées')
        },
        onError: () => toast.error('Erreur lors de la sauvegarde'),
      }
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
          onClick={() => navigate('/applications')}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux candidatures
        </button>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={item}
        className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl">
              {application.jobOfferId?.title || 'Offre inconnue'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-surface-500 dark:text-surface-400">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{application.jobOfferId?.company || ''}</span>
              </span>
              {application.email?.sentAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(application.email.sentAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              )}
            </div>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-surface-100 pt-6 dark:border-surface-700">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleFollow}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
          >
            <Bell className="h-4 w-4" />
            Suivre
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRelance}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-5 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <RefreshCw className="h-4 w-4" />
            Relancer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-5 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700"
          >
            <PenLine className="h-4 w-4" />
            Modifier
          </motion.button>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <h2 className="mb-6 text-lg font-bold text-surface-900 dark:text-surface-50">
              Parcours de la candidature
            </h2>
            <div className="ml-1">
              {timelineSteps.map((step, index) => {
                const timelineEntry = timeline.find((t) => t.status === step.key)
                const isCompleted = timeline.some(
                  (t) => statusOrder.indexOf(t.status) >= statusOrder.indexOf(step.key)
                ) && step.key !== 'refusee'
                const isCurrent = step.key === application.status
                const isFailed = application.status === 'refusee' && index === timelineSteps.length - 1

                return (
                  <TimelineStep
                    key={step.key}
                    step={{
                      ...step,
                      date: timelineEntry?.date,
                      description: timelineEntry?.description,
                    }}
                    index={index}
                    isCompleted={isCompleted && !isCurrent}
                    isCurrent={isCurrent}
                    isFailed={isFailed}
                  />
                )
              })}
            </div>
          </motion.div>

          {/* Email Details */}
          {email && email.subject && (
            <motion.div
              variants={item}
              className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
                <Mail className="h-5 w-5 text-primary-500" />
                Détails de l'email
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
                    Objet
                  </label>
                  <p className="rounded-xl bg-surface-50 px-4 py-3 text-sm font-medium text-surface-700 dark:bg-surface-700/50 dark:text-surface-200">
                    {email.subject}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-surface-500 dark:text-surface-400">
                    Contenu
                  </label>
                  <div className="rounded-xl border border-surface-100 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-700/30">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                      {email.body}
                    </p>
                  </div>
                </div>
                {email.sentAt && (
                  <div className="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
                    <Clock className="h-3.5 w-3.5" />
                    Envoyé le{' '}
                    {format(new Date(email.sentAt), "dd MMMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Candidate Info */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <h3 className="mb-4 text-lg font-bold text-surface-900 dark:text-surface-50">
              Informations
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-700">
                  <User className="h-4 w-4 text-surface-500 dark:text-surface-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
                    Candidat
                  </p>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {application.candidateName || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-700">
                  <Building2 className="h-4 w-4 text-surface-500 dark:text-surface-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
                    Entreprise
                  </p>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {application.jobOfferId?.company || '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-surface-100 p-2 dark:bg-surface-700">
                  <StatusIcon className="h-4 w-4 text-surface-500 dark:text-surface-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-400 dark:text-surface-500">
                    Statut actuel
                  </p>
                  <p className={`text-sm font-semibold ${status.color.split(' ').pop()}`}>
                    {status.label}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
                <StickyNote className="h-5 w-5 text-accent-500" />
                Notes
              </h3>
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Modifier
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notes || application.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-700 transition-colors placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700/50 dark:text-surface-200 dark:placeholder:text-surface-500 dark:focus:border-primary-400"
                  placeholder="Ajouter des notes..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNotes}
                    className="rounded-lg bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingNotes(false)
                      setNotes('')
                    }}
                    className="rounded-lg border border-surface-200 px-4 py-2 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {application.notes || (
                  <span className="italic text-surface-400 dark:text-surface-500">
                    Aucune note pour cette candidature.
                  </span>
                )}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
