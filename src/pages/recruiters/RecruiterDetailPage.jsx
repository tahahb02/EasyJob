import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Building2,
  Users,
  Tag,
  Plus,
  X,
  MessageSquare,
  Pencil,
  Clock,
  Send,
  Phone,
  Video,
  Mail,
  Loader2,
} from 'lucide-react'

import { useRecruiter, useUpdateRecruiter } from '@/api/hooks'
import toast from 'react-hot-toast'

const connectionColors = {
  '1st': 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400',
  '2nd': 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
  '3rd+': 'bg-surface-200 text-surface-600 dark:bg-surface-600 dark:text-surface-400',
}

const avatarColors = [
  'bg-primary-500', 'bg-secondary-500', 'bg-accent-500', 'bg-purple-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500',
]

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function RecruiterDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useRecruiter(id)
  const recruiter = data?.recruiter
  const updateMutation = useUpdateRecruiter()

  const [notes, setNotes] = useState(recruiter?.notes || '')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [tags, setTags] = useState(recruiter?.tags || [])
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (recruiter) {
      setNotes(recruiter.notes || '')
      setTags(recruiter.tags || [])
    }
  }, [recruiter])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
        <p className="mt-4 text-surface-500 dark:text-surface-400">Chargement...</p>
      </div>
    )
  }

  if (!recruiter) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
          <Users className="mb-4 h-16 w-16 text-surface-300 dark:text-surface-600" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Recruteur non trouvé</h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">Ce recruteur n'existe pas ou a été supprimé.</p>
          <button onClick={() => navigate('/recruiters')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600">
            <ArrowLeft className="h-4 w-4" /> Retour aux recruteurs
          </button>
        </motion.div>
      </div>
    )
  }

  const initials = `${recruiter.firstName[0]}${recruiter.lastName[0]}`
  const avatarColor = getAvatarColor(`${recruiter.firstName}${recruiter.lastName}`)

  const handleAddTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      const newTags = [...tags, trimmed]
      setTags(newTags)
      setNewTag('')
      updateMutation.mutate(
        { id: recruiter._id || recruiter.id, tags: newTags },
        {
          onError: () => toast.error('Erreur lors de la sauvegarde du tag'),
        }
      )
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove)
    setTags(newTags)
    updateMutation.mutate(
      { id: recruiter._id || recruiter.id, tags: newTags },
      {
        onError: () => toast.error('Erreur lors de la suppression du tag'),
      }
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <motion.div variants={item}>
        <button onClick={() => navigate('/recruiters')} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100">
          <ArrowLeft className="h-4 w-4" /> Retour aux recruteurs
        </button>
      </motion.div>

      <motion.div variants={item} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white ${avatarColor}`}>
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">{recruiter.firstName} {recruiter.lastName}</h1>
            <p className="mt-1 text-lg font-medium text-surface-500 dark:text-surface-400">{recruiter.title}</p>
            <p className="text-surface-600 dark:text-surface-300">{recruiter.company}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
            <div className="rounded-lg bg-surface-200 p-2 dark:bg-surface-600"><MapPin className="h-4 w-4 text-surface-500 dark:text-surface-400" /></div>
            <div>
              <p className="text-xs font-medium text-surface-400 dark:text-surface-500">Localisation</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{recruiter.location || 'Non renseigné'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
            <div className="rounded-lg bg-surface-200 p-2 dark:bg-surface-600"><Building2 className="h-4 w-4 text-surface-500 dark:text-surface-400" /></div>
            <div>
              <p className="text-xs font-medium text-surface-400 dark:text-surface-500">Secteur</p>
              <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{recruiter.sector || 'Non renseigné'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
            <div className="rounded-lg bg-surface-200 p-2 dark:bg-surface-600"><Users className="h-4 w-4 text-surface-500 dark:text-surface-400" /></div>
            <div>
              <p className="text-xs font-medium text-surface-400 dark:text-surface-500">Connexion</p>
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${connectionColors[recruiter.connectionDegree] || connectionColors['3rd+']}`}>
                {recruiter.connectionDegree || '3rd+'}
              </span>
            </div>
          </div>
          {recruiter.linkedinUrl && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
              <div className="rounded-lg bg-surface-200 p-2 dark:bg-surface-600"><ExternalLink className="h-4 w-4 text-surface-500 dark:text-surface-400" /></div>
              <div>
                <p className="text-xs font-medium text-surface-400 dark:text-surface-500">LinkedIn</p>
                <a href={recruiter.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline dark:text-primary-400">
                  Voir profil
                </a>
              </div>
            </div>
          )}
          {recruiter.email && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
              <div className="rounded-lg bg-surface-200 p-2 dark:bg-surface-600"><Mail className="h-4 w-4 text-surface-500 dark:text-surface-400" /></div>
              <div>
                <p className="text-xs font-medium text-surface-400 dark:text-surface-500">Email</p>
                <a href={`mailto:${recruiter.email}`} className="text-sm font-medium text-primary-500 hover:text-primary-600 hover:underline dark:text-primary-400">
                  {recruiter.email}
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-3">
        {recruiter.linkedinUrl && (
          <a href={recruiter.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#004182]">
            <MessageSquare className="h-4 w-4" /> Message LinkedIn
          </a>
        )}
        {recruiter.email && (
          <a href={`mailto:${recruiter.email}`} className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600">
            <Mail className="h-4 w-4" /> Envoyer un email
          </a>
        )}
        {recruiter.phone && (
          <a href={`tel:${recruiter.phone}`} className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-5 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600">
            <Phone className="h-4 w-4" /> Appeler
          </a>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.div variants={item} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-surface-900 dark:text-surface-50">
                <Pencil className="h-5 w-5 text-accent-500" /> Notes personnelles
              </h2>
              {!isEditingNotes && (
                <button onClick={() => setIsEditingNotes(true)} className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400">
                  Modifier
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Ajoutez vos notes sur ce recruteur..." className="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm leading-relaxed text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:placeholder:text-surface-500 dark:focus:border-primary-400" />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateMutation.mutate(
                        { id: recruiter._id || recruiter.id, notes },
                        {
                          onSuccess: () => {
                            setIsEditingNotes(false)
                            toast.success('Notes sauvegardées')
                          },
                          onError: () => toast.error('Erreur lors de la sauvegarde'),
                        }
                      )
                    }}
                    disabled={updateMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                  >
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Sauvegarder
                  </button>
                  <button onClick={() => { setIsEditingNotes(false); setNotes(recruiter?.notes || '') }} className="inline-flex items-center gap-1.5 rounded-xl border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <p className="leading-relaxed text-surface-600 dark:text-surface-400">{notes || 'Aucune note pour ce recruteur.'}</p>
            )}
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-surface-900 dark:text-surface-50">
              <Clock className="h-5 w-5 text-primary-500" /> Historique des interactions
            </h2>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-3 h-10 w-10 text-surface-300 dark:text-surface-600" />
              <p className="text-sm text-surface-500 dark:text-surface-400">Aucune interaction enregistrée pour le moment.</p>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={item} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
              <Tag className="h-5 w-5 text-secondary-500" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {tags.map((tag) => (
                  <motion.span key={tag} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-400">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary-100 dark:hover:bg-primary-500/20">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-3 flex gap-2">
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag() }} placeholder="Nouveau tag..." className="flex-1 rounded-xl border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:placeholder:text-surface-500" />
              <button onClick={handleAddTag} className="inline-flex items-center gap-1 rounded-xl bg-secondary-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-600">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
            <h3 className="mb-4 text-lg font-bold text-surface-900 dark:text-surface-50">Contact rapide</h3>
            <div className="space-y-3">
              {recruiter.linkedinUrl && (
                <a href={recruiter.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#004182]">
                  <Send className="h-4 w-4" /> Message LinkedIn
                </a>
              )}
              {recruiter.email && (
                <a href={`mailto:${recruiter.email}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700">
                  <Mail className="h-4 w-4" /> Envoyer un email
                </a>
              )}
              {recruiter.phone && (
                <a href={`tel:${recruiter.phone}`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 px-4 py-3 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-300 dark:hover:bg-surface-700">
                  <Phone className="h-4 w-4" /> Appeler
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
