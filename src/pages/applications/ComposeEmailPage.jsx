import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Send,
  Save,
  Sparkles,
  Paperclip,
  Eye,
  EyeOff,
  Mail,
  User,
  FileText,
  Link as LinkIcon,
  MessageSquare,
  StickyNote,
  Building2,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

import {
  useJob,
  useEmailTemplates,
  useCreateApplication,
  useSendApplication,
} from '@/api/hooks'

const schema = z.object({
  recipient: z.string().email('Email invalide'),
  subject: z.string().min(5, 'L\'objet doit contenir au moins 5 caractères'),
  body: z.string().min(20, 'Le corps de l\'email doit contenir au moins 20 caractères'),
  attachCv: z.boolean(),
  portfolioUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  coverLetter: z.string().optional(),
  notes: z.string().optional(),
})

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function replaceVariables(text, vars) {
  let result = text
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || `[${key}]`)
  }
  return result
}

function SkeletonBlock({ className }) {
  return (
    <div className={`animate-pulse rounded-xl bg-surface-200 dark:bg-surface-700 ${className}`} />
  )
}

function ComposeSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-9 w-16" />
      <div className="space-y-2">
        <SkeletonBlock className="h-9 w-80" />
        <SkeletonBlock className="h-5 w-64" />
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-500/30 dark:bg-primary-500/10">
        <SkeletonBlock className="h-12 w-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-6 w-56" />
          <SkeletonBlock className="h-4 w-72" />
        </div>
      </div>
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800 space-y-4">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="h-11 w-full" />
        <SkeletonBlock className="h-11 w-full" />
        <SkeletonBlock className="h-11 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function ComposeEmailPage() {
  const { jobOfferId } = useParams()
  const navigate = useNavigate()

  const { data: jobData, isLoading: jobLoading, isError: jobError } = useJob(jobOfferId)
  const job = jobData?.job
  const { data: templatesData, isLoading: templatesLoading } = useEmailTemplates()
  const createApplication = useCreateApplication()
  const sendApplication = useSendApplication()

  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingField, setGeneratingField] = useState(null)

  const templates = useMemo(() => {
    if (!templatesData) return {}
    if (Array.isArray(templatesData)) {
      return templatesData.reduce((acc, t) => {
        acc[t.key || t.id || t.name] = {
          label: t.label || t.name,
          subject: t.subject || '',
          body: t.body || t.content || '',
        }
        return acc
      }, {})
    }
    return templatesData
  }, [templatesData])

  const templateOptions = useMemo(
    () =>
      Object.entries(templates).map(([key, t]) => ({
        value: key,
        label: t.label,
      })),
    [templates]
  )

  const userVars = useMemo(() => ({
    userName: job?.user?.name || job?.userName || '',
    jobTitle: job?.title || '',
    company: job?.company || '',
    recruiterName: job?.recruiterName || 'Responsable du recrutement',
    experienceYears: String(job?.user?.experienceYears || '3'),
    studyField: job?.user?.studyField || 'Informatique',
  }), [job])

  const defaultSubject = useMemo(
    () => `Candidature au poste de ${job?.title || ''} chez ${job?.company || ''}`,
    [job]
  )

  const firstTemplateKey = Object.keys(templates)[0]
  const defaultBody = useMemo(() => {
    const tpl = firstTemplateKey ? templates[firstTemplateKey] : null
    return tpl ? replaceVariables(tpl.body, userVars) : ''
  }, [templates, firstTemplateKey, userVars])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      recipient: '',
      subject: '',
      body: '',
      attachCv: true,
      portfolioUrl: '',
      coverLetter: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (job && firstTemplateKey && templates[firstTemplateKey]) {
      const tpl = templates[firstTemplateKey]
      reset({
        recipient: `recrutement@${(job.company || 'entreprise').toLowerCase().replace(/\s+/g, '')}.ma`,
        subject: replaceVariables(tpl.subject, { ...userVars, jobTitle: job.title, company: job.company }),
        body: replaceVariables(tpl.body, { ...userVars, jobTitle: job.title, company: job.company }),
        attachCv: true,
        portfolioUrl: '',
        coverLetter: '',
        notes: '',
      })
      setSelectedTemplate(firstTemplateKey)
    }
  }, [job, templates, firstTemplateKey, userVars, reset])

  const watchedBody = watch('body')
  const watchedSubject = watch('subject')
  const watchedRecipient = watch('recipient')
  const watchedAttachCv = watch('attachCv')

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey)
    const template = templates[templateKey]
    if (template) {
      setValue('subject', replaceVariables(template.subject, userVars))
      setValue('body', replaceVariables(template.body, userVars))
    }
  }

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    setGeneratingField('body')
    await new Promise((r) => setTimeout(r, 2000))
    const aiText = `Madame, Monsieur,

Ayant pris connaissance avec un grand intérêt de votre offre pour le poste de ${job?.title || '...'} chez ${job?.company || '...'}, je souhaite vous soumettre ma candidature.

Fort de solides compétences techniques et d'une expérience significative dans ce domaine, je suis convaincu de pouvoir apporter une réelle valeur ajoutée à votre équipe. Ma rigueur, ma capacité d'adaptation et mon esprit d'innovation sont des atouts que je souhaite mettre au service de vos projets ambitieux.

Au cours de mes précédentes expériences, j'ai eu l'occasion de développer une expertise approfondie qui correspond parfaitement aux exigences de ce poste. Ma curiosité technique et mon engagement envers l'excellence me permettent de rester à la pointe des technologies émergentes.

Je serais ravi de pouvoir échanger avec vous lors d'un entretien afin de vous présenter plus en détail mon parcours et ma motivation. Je reste à votre entière disposition pour tout complément d'information.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${userVars.userName || ''}`

    setValue('body', aiText)
    setIsGenerating(false)
    setGeneratingField(null)
    toast.success('Email généré avec succès')
  }

  const onSubmit = async (data) => {
    try {
      const appData = {
        jobOfferId: jobOfferId,
        coverLetter: data.coverLetter || '',
        portfolioUrl: data.portfolioUrl || '',
        notes: data.notes || '',
      }
      const createdApp = await createApplication.mutateAsync(appData)
      const appId = createdApp.application?.id || createdApp.application?._id

      const emailData = {
        to: data.recipient,
        subject: data.subject,
        body: data.body,
        attachCv: data.attachCv,
      }
      await sendApplication.mutateAsync({ id: appId, emailData })

      toast.success('Candidature envoyée avec succès !')
      navigate('/applications')
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'envoi de la candidature")
    }
  }

  const onSaveDraft = async () => {
    try {
      const formValues = watch()
      const appData = {
        jobOfferId: jobOfferId,
        status: 'draft',
        coverLetter: formValues.coverLetter || '',
        portfolioUrl: formValues.portfolioUrl || '',
        notes: formValues.notes || '',
        email: {
          to: formValues.recipient,
          subject: formValues.subject,
          body: formValues.body,
          attachCv: formValues.attachCv,
        },
      }
      await createApplication.mutateAsync(appData)
      toast.success('Brouillon enregistré')
      navigate('/applications')
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement du brouillon")
    }
  }

  if (jobLoading || templatesLoading) {
    return <ComposeSkeleton />
  }

  if (jobError || !job) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <Mail className="mb-4 h-16 w-16 text-surface-300 dark:text-surface-600" />
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Offre non trouvée
          </h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            {jobError?.response?.data?.message || "L'offre d'emploi associée n'existe pas ou a été supprimée."}
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux offres
          </button>
        </motion.div>
      </div>
    )
  }

  const isMutating = createApplication.isPending || sendApplication.isPending

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Back Button */}
      <motion.div variants={item}>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </motion.div>

      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
          Rédiger votre candidature
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Personnalisez et envoyez votre candidature par email
        </p>
      </motion.div>

      {/* Job Info Card */}
      <motion.div
        variants={item}
        className="flex items-center gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5 shadow-sm dark:border-primary-500/30 dark:bg-primary-500/10"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white dark:bg-primary-600">
          <Building2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">
            {job.title}
          </h3>
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {job.company} &middot; {job.location} &middot; {job.contractType}
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Fields */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
            <Mail className="h-5 w-5 text-primary-500" />
            Composition de l'email
          </h2>

          <div className="space-y-4">
            {/* Recipient */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Destinataire
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  {...register('recipient')}
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                  placeholder="recrutement@entreprise.ma"
                />
              </div>
              {errors.recipient && (
                <p className="mt-1 text-xs text-danger-500">{errors.recipient.message}</p>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                Objet
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  {...register('subject')}
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                />
              </div>
              {errors.subject && (
                <p className="mt-1 text-xs text-danger-500">{errors.subject.message}</p>
              )}
            </div>

            {/* Template Selector */}
            {templateOptions.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Template
                </label>
                <div className="relative">
                  <select
                    value={selectedTemplate || ''}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-10 text-sm font-medium text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                  >
                    {templateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                </div>
              </div>
            )}

            {/* Email Body */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Corps de l'email
                </label>
                <motion.button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isGenerating && generatingField === 'body' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {isGenerating ? 'Génération...' : 'Générer avec AI'}
                </motion.button>
              </div>
              <textarea
                {...register('body')}
                rows={16}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm leading-relaxed text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
              />
              {errors.body && (
                <p className="mt-1 text-xs text-danger-500">{errors.body.message}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Options */}
        <motion.div
          variants={item}
          className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
        >
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
            <Paperclip className="h-5 w-5 text-secondary-500" />
            Options
          </h2>

          <div className="space-y-5">
            {/* Attach CV */}
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-surface-200 p-4 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:hover:bg-surface-700/50">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${watchedAttachCv ? 'bg-secondary-50 dark:bg-secondary-500/10' : 'bg-surface-100 dark:bg-surface-700'}`}>
                  <Paperclip className={`h-4 w-4 ${watchedAttachCv ? 'text-secondary-500' : 'text-surface-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Joindre le CV
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    Inclure votre CV actuel en pièce jointe
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  {...register('attachCv')}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-surface-300 transition-colors peer-checked:bg-secondary-500 dark:bg-surface-600" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>

            {/* Portfolio URL */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                <LinkIcon className="h-4 w-4 text-surface-400" />
                URL Portfolio (optionnel)
              </label>
              <input
                type="url"
                {...register('portfolioUrl')}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                placeholder="https://mon-portfolio.com"
              />
              {errors.portfolioUrl && (
                <p className="mt-1 text-xs text-danger-500">{errors.portfolioUrl.message}</p>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                <FileText className="h-4 w-4 text-surface-400" />
                Lettre de motivation (optionnel)
              </label>
              <textarea
                {...register('coverLetter')}
                rows={4}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                placeholder="Ajoutez une lettre de motivation personnalisée..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                <StickyNote className="h-4 w-4 text-surface-400" />
                Notes internes (optionnel)
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-xl border border-surface-200 bg-surface-50 p-4 text-sm text-surface-700 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-200"
                placeholder="Notes personnelles (non incluses dans l'email)..."
              />
            </div>
          </div>
        </motion.div>

        {/* Preview Section */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Masquer l\'aperçu' : 'Voir l\'aperçu'}
          </button>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-800"
            >
              <div className="border-b border-surface-200 bg-surface-50 px-6 py-4 dark:border-surface-700 dark:bg-surface-700/50">
                <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                  Aperçu de l'email
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-20 shrink-0 font-medium text-surface-500 dark:text-surface-400">À :</span>
                    <span className="text-surface-700 dark:text-surface-300">{watchedRecipient}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 shrink-0 font-medium text-surface-500 dark:text-surface-400">Objet :</span>
                    <span className="font-semibold text-surface-800 dark:text-surface-200">{watchedSubject}</span>
                  </div>
                  {watchedAttachCv && (
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 font-medium text-surface-500 dark:text-surface-400">PJ :</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                        <Paperclip className="h-3 w-3" />
                        CV.pdf
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-5 border-t border-surface-100 pt-5 dark:border-surface-700">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                    {watchedBody}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={item}
          className="flex flex-col items-center gap-3 border-t border-surface-200 pt-6 dark:border-surface-700 sm:flex-row sm:justify-end"
        >
          <motion.button
            type="button"
            onClick={onSaveDraft}
            disabled={isMutating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-6 py-3 text-sm font-semibold text-surface-700 shadow-sm transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600 sm:w-auto disabled:opacity-50"
          >
            {createApplication.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {createApplication.isPending ? 'Enregistrement...' : 'Enregistrer brouillon'}
          </motion.button>

          <motion.button
            type="submit"
            disabled={isMutating}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-500 sm:w-auto"
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isMutating ? 'Envoi en cours...' : 'Envoyer la candidature'}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  )
}
