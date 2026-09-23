import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  X, Mail, Briefcase, Scissors, Clock, CheckCircle,
  UserPlus, Sparkles, CalendarCheck, ExternalLink, CheckCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const typeConfig = {
  nouvelle_offre: { icon: Briefcase, color: 'text-primary-500', bg: 'bg-primary-500/10', label: 'Offre' },
  candidature: { icon: CheckCircle, color: 'text-secondary-500', bg: 'bg-secondary-500/10', label: 'Candidature' },
  candidature_statut: { icon: CheckCircle, color: 'text-secondary-500', bg: 'bg-secondary-500/10', label: 'Candidature' },
  nouvelle_candidature: { icon: UserPlus, color: 'text-secondary-500', bg: 'bg-secondary-500/10', label: 'Candidature' },
  entretien: { icon: CalendarCheck, color: 'text-secondary-500', bg: 'bg-secondary-500/10', label: 'Entretien' },
  acceptation: { icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Acceptation' },
  email: { icon: Mail, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Email' },
  scrapping: { icon: Scissors, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Scraping' },
  rappel: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Rappel' },
  nouvelle_entreprise: { icon: Briefcase, color: 'text-primary-500', bg: 'bg-primary-500/10', label: 'Entreprise' },
  candidat_suggere: { icon: Briefcase, color: 'text-primary-500', bg: 'bg-primary-500/10', label: 'Candidats' },
}

const DEFAULT_ACTION_URL = '/notifications'

const LABELS = {
  jobOfferId: 'Offre',
  applicationId: 'Candidature',
  companyName: 'Entreprise',
  companyEmailId: 'Entreprise',
  subject: 'Objet',
  emailId: 'Email',
  newStatus: 'Statut',
  source: 'Source',
  matchCount: 'Correspondances',
  totalSkills: 'Compétences',
  candidateCount: 'Candidats',
  count: 'Résultats',
  fromName: 'De',
}

export function resolveNotificationActionUrl(notification) {
  if (notification.actionUrl) return notification.actionUrl
  const data = notification.data || {}
  if (data.jobOfferId) return `/jobs/${data.jobOfferId}`
  if (data.applicationId) return `/applications/${data.applicationId}`
  if (data.companyEmailId) return `/company-emails`
  return DEFAULT_ACTION_URL
}

export default function NotificationDetailModal({ notification, onClose, onMarkRead, onGoToAction }) {
  useEffect(() => {
    if (!notification) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [notification, onClose])

  useEffect(() => {
    if (notification) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [notification])

  const config = notification
    ? (typeConfig[notification.type] || typeConfig.email)
    : null
  const Icon = config?.icon || Mail

  const meta = notification?.data && typeof notification.data === 'object'
    ? Object.entries(notification.data).filter(([, v]) => typeof v !== 'object' && v !== null && v !== undefined)
    : []

  return (
    <AnimatePresence>
      {notification && config && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-5 border-b border-surface-100 dark:border-surface-700">
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="absolute right-4 top-4 flex items-center justify-center w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 transition"
              >
                <X size={16} />
              </button>
              <div className="flex items-start gap-3.5 pr-8">
                <div className={`flex-shrink-0 p-3 rounded-xl ${config.bg}`}>
                  <Icon size={22} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 rounded-full">
                      {config.label}
                    </span>
                    <span className="text-[11px] text-surface-400 dark:text-surface-500">
                      {format(new Date(notification.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-base font-semibold text-surface-900 dark:text-white leading-snug">
                    {notification.title}
                  </h2>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                {notification.message}
              </p>

              {meta.length > 0 && (
                <div className="mt-5 rounded-xl bg-surface-100 dark:bg-surface-800 p-4 space-y-2.5">
                  {meta.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <span className="text-xs text-surface-500 dark:text-surface-400 flex-shrink-0">
                        {LABELS[key] || key}
                      </span>
                      <span className="text-xs font-semibold text-surface-900 dark:text-white text-right break-words">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onMarkRead && onMarkRead(notification._id || notification.id)}
                className="flex-1 gap-1.5"
              >
                <CheckCheck size={15} />
                Marquer comme lu
              </Button>
              <Button
                onClick={onGoToAction}
                className="flex-1 gap-1.5"
              >
                <ExternalLink size={15} />
                Voir le détail
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}