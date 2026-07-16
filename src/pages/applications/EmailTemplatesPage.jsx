import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  X,
  Mail,
  Tag,
  Copy,
  Variable,
  Hash,
  User,
  Building2,
  Briefcase,
  BookOpen,
  Calendar,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
} from '@/api/hooks'

const availableVariables = [
  { variable: '{{userName}}', description: 'Votre nom complet', icon: User },
  { variable: '{{jobTitle}}', description: 'Titre du poste', icon: Briefcase },
  { variable: '{{company}}', description: "Nom de l'entreprise", icon: Building2 },
  { variable: '{{recruiterName}}', description: 'Nom du recruteur', icon: User },
  { variable: '{{experienceYears}}', description: "Années d'expérience", icon: Hash },
  { variable: '{{studyField}}', description: "Domaine d'études", icon: BookOpen },
  { variable: '{{applicationDate}}', description: 'Date de candidature', icon: Calendar },
]

const categoryColors = {
  Candidature: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-400',
  Stage: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-400',
  Relance: 'bg-accent-100 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400',
  Suivi: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  Personnalisé: 'bg-surface-100 text-surface-700 dark:bg-surface-600 dark:text-surface-300',
}

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

const defaultTemplate = {
  name: '',
  subject: '',
  body: '',
}

export default function EmailTemplatesPage() {
  const { data: templates, isLoading, isError } = useEmailTemplates()
  const createMutation = useCreateEmailTemplate()
  const updateMutation = useUpdateEmailTemplate()
  const deleteMutation = useDeleteEmailTemplate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [form, setForm] = useState(defaultTemplate)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const templateList = Array.isArray(templates) ? templates : []

  const handleCreate = () => {
    setEditingTemplate(null)
    setForm(defaultTemplate)
    setIsModalOpen(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (editingTemplate) {
      updateMutation.mutate(
        {
          id: editingTemplate._id || editingTemplate.id,
          name: form.name,
          subject: form.subject,
          body: form.body,
        },
        {
          onSuccess: () => {
            toast.success('Template mis à jour')
            setIsModalOpen(false)
            setForm(defaultTemplate)
            setEditingTemplate(null)
          },
          onError: () => toast.error('Erreur lors de la sauvegarde'),
        }
      )
    } else {
      createMutation.mutate(
        {
          name: form.name,
          subject: form.subject,
          body: form.body,
          category: 'Personnalisé',
        },
        {
          onSuccess: () => {
            toast.success('Template créé')
            setIsModalOpen(false)
            setForm(defaultTemplate)
          },
          onError: () => toast.error('Erreur lors de la création'),
        }
      )
    }
  }

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null)
        toast.success('Template supprimé')
      },
      onError: () => {
        toast.error('Erreur lors de la suppression')
      },
    })
  }

  const handleCopyVariable = (variable) => {
    navigator.clipboard.writeText(variable)
    toast.success(`"${variable}" copié`)
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
            Templates d'emails
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Gérez vos modèles d'email pour vos candidatures
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          <Plus className="h-4 w-4" />
          Créer un template
        </motion.button>
      </motion.div>

      {/* Content Grid: Templates + Variables Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Templates Grid */}
        <div className="space-y-4 lg:col-span-2">
          <motion.div variants={item}>
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              <span className="font-bold text-surface-900 dark:text-surface-100">
                {templateList.length}
              </span>{' '}
              {templateList.length === 1 ? 'template' : 'templates'}
            </p>
          </motion.div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 text-center dark:border-danger-500/30 dark:bg-danger-500/10">
              <p className="text-sm font-medium text-danger-600 dark:text-danger-400">
                Erreur lors du chargement des templates
              </p>
            </div>
          )}

          {!isLoading && !isError && (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {templateList.map((template) => (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group flex flex-col rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-surface-900 dark:text-surface-50">
                            {template.name}
                          </h3>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              categoryColors[template.category] || categoryColors.Personnalisé
                            }`}
                          >
                            {template.category}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-1 text-sm text-surface-500 dark:text-surface-400">
                          <span className="font-medium text-surface-400 dark:text-surface-500">Objet :</span>{' '}
                          {template.subject}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2 border-t border-surface-100 pt-4 dark:border-surface-700">
                      <button
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                      >
                        <Edit3 className="h-3 w-3" />
                        Modifier
                      </button>
                      <div className="relative ml-auto">
                        <button
                          onClick={() => setDeleteConfirm(deleteConfirm === template.id ? null : template.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600 dark:border-surface-600 dark:text-surface-400 dark:hover:border-danger-500/30 dark:hover:bg-danger-500/10 dark:hover:text-danger-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <AnimatePresence>
                          {deleteConfirm === template.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -5 }}
                              className="absolute bottom-full right-0 z-20 mb-2 w-48 rounded-xl border border-surface-200 bg-white p-3 shadow-lg dark:border-surface-700 dark:bg-surface-800"
                            >
                              <p className="text-xs font-medium text-surface-700 dark:text-surface-300">
                                Supprimer ce template ?
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="flex-1 rounded-lg border border-surface-200 px-2 py-1 text-xs font-medium text-surface-600 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                                >
                                  Annuler
                                </button>
                                <button
                                  onClick={() => handleDelete(template.id)}
                                  disabled={deleteMutation.isPending}
                                  className="flex-1 rounded-lg bg-danger-500 px-2 py-1 text-xs font-medium text-white hover:bg-danger-600 disabled:opacity-50"
                                >
                                  {deleteMutation.isPending ? '...' : 'Supprimer'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!isLoading && templateList.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-surface-300 bg-surface-50 p-12 text-center dark:border-surface-600 dark:bg-surface-800/50">
                  <FileText className="mx-auto h-10 w-10 text-surface-400" />
                  <p className="mt-3 text-sm font-medium text-surface-600 dark:text-surface-400">
                    Aucun template pour le moment
                  </p>
                  <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
                    Créez votre premier template pour gagner du temps
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Variables Reference Sidebar */}
        <motion.div variants={item} className="lg:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
              <Variable className="h-5 w-5 text-accent-500" />
              Variables disponibles
            </h2>
            <p className="mb-5 text-xs text-surface-400 dark:text-surface-500">
              Cliquez pour copier une variable
            </p>

            <div className="space-y-3">
              {availableVariables.map((v) => {
                const Icon = v.icon
                return (
                  <button
                    key={v.variable}
                    onClick={() => handleCopyVariable(v.variable)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-surface-100 p-3 text-left transition-colors hover:border-primary-200 hover:bg-primary-50 dark:border-surface-600 dark:hover:border-primary-500/30 dark:hover:bg-primary-500/5"
                  >
                    <div className="shrink-0 rounded-lg bg-surface-100 p-1.5 transition-colors group-hover:bg-primary-100 dark:bg-surface-700 dark:group-hover:bg-primary-500/20">
                      <Icon className="h-3.5 w-3.5 text-surface-500 transition-colors group-hover:text-primary-500 dark:text-surface-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <code className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {v.variable}
                      </code>
                      <p className="text-xs text-surface-400 dark:text-surface-500">
                        {v.description}
                      </p>
                    </div>
                    <Copy className="h-3.5 w-3.5 shrink-0 text-surface-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-surface-600" />
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
              <h3 className="text-xs font-semibold text-surface-600 dark:text-surface-400">
                Astuce
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                Les variables sont automatiquement remplacées par les informations du poste et du profil lors de l'envoi.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Template Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              className="fixed inset-4 z-50 mx-auto my-auto max-w-2xl overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-800 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-700">
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">
                  {editingTemplate ? 'Modifier le template' : 'Créer un template'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* Template Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      Nom du template
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                        placeholder="Mon template personnalisé"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      Objet de l'email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                        className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                        placeholder="Candidature au poste de {{jobTitle}} chez {{company}}"
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                      Corps du template
                    </label>
                    <textarea
                      value={form.body}
                      onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                      rows={12}
                      className="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm leading-relaxed text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                      placeholder="Rédigez votre template ici... Utilisez {{variable}} pour les valeurs dynamiques."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-surface-200 px-6 py-4 dark:border-surface-700">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="inline h-4 w-4 animate-spin" />
                  ) : editingTemplate ? (
                    'Enregistrer les modifications'
                  ) : (
                    'Créer le template'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
