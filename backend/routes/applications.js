import express from 'express'
import Application from '../models/Application.js'
import JobOffer from '../models/JobOffer.js'
import User from '../models/User.js'
import CV from '../models/CV.js'
import { protect } from '../middlewares/auth.js'
import { sendEmail, escapeHtml, brandLayout } from '../utils/sendEmail.js'
import {
  notifyApplicationStatusChange,
  notifyNewApplicationToRecruiter,
  notifyEmailReceived,
} from '../services/NotificationService.js'
import { recordCandidateEmail } from '../services/MailService.js'
import {
  isValidObjectId,
  clampInt,
  asString,
  pick,
  APPLICATION_EDITABLE_FIELDS,
  APPLICATION_STATUSES,
} from '../utils/validation.js'

const router = express.Router()

// GET /api/applications
router.get('/', protect, async (req, res) => {
  try {
    const { status, page, limit } = req.query
    const query = { userId: req.user._id }
    if (status && status !== 'all') {
      if (!APPLICATION_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Filtre de statut invalide' })
      }
      query.status = status
    }

    const currentPage = clampInt(page, { min: 1, max: 100000, fallback: 1 })
    const perPage = clampInt(limit, { min: 1, max: 100, fallback: 50 })
    const skip = (currentPage - 1) * perPage
    const [applications, total] = await Promise.all([
      Application.find(query).populate('jobOfferId', 'title company location contractType source sourceUrl').sort({ updatedAt: -1 }).skip(skip).limit(perPage),
      Application.countDocuments(query),
    ])
    res.json({ applications, total, page: currentPage, pages: Math.ceil(total / perPage) })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/applications/:id
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de candidature invalide' })
    }
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id }).populate('jobOfferId')
    if (!app) return res.status(404).json({ error: 'Candidature non trouvée' })
    res.json({ application: app })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/applications - Create or mark as applied
router.post('/', protect, async (req, res) => {
  try {
    const { jobOfferId } = req.body || {}

    // Sans cette validation, `Application.create` levait une CastError → 500,
    // et un `jobOfferId` valide mais inexistant créait une candidature orpheline
    // (201) qui n'apparaissait jamais dans `/api/jobs`.
    if (!isValidObjectId(jobOfferId)) {
      return res.status(400).json({ error: 'Offre d\'emploi invalide' })
    }
    const jobOffer = await JobOffer.findById(jobOfferId).select('_id isActive')
    if (!jobOffer) {
      return res.status(404).json({ error: 'Offre d\'emploi introuvable' })
    }
    if (jobOffer.isActive === false) {
      return res.status(400).json({ error: 'Cette offre n\'accepte plus de candidatures' })
    }

    const existing = await Application.findOne({ userId: req.user._id, jobOfferId })
    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà postulé à cette offre' })
    }

    const application = await Application.create({
      userId: req.user._id,
      jobOfferId,
      status: 'envoyee',
      appliedAt: new Date(),
      statusHistory: [{ status: 'envoyee', changedAt: new Date(), changedBy: 'candidat', note: 'Candidature envoyée' }],
    })

    notifyNewApplicationToRecruiter(application, await JobOffer.findById(jobOfferId))

    res.status(201).json({ application, message: 'Candidature enregistrée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

// POST /api/applications/mark-applied - Quick mark as applied
router.post('/mark-applied', protect, async (req, res) => {
  try {
    const { jobOfferId } = req.body || {}
    if (!isValidObjectId(jobOfferId)) return res.status(400).json({ error: 'Offre d\'emploi invalide' })

    const jobOffer = await JobOffer.findById(jobOfferId).select('_id isActive')
    if (!jobOffer) return res.status(404).json({ error: 'Offre d\'emploi introuvable' })

    const existing = await Application.findOne({ userId: req.user._id, jobOfferId })
    if (existing) {
      existing.status = 'envoyee'
      existing.appliedAt = new Date()
      await existing.save()
      return res.json({ application: existing, message: 'Déjà enregistré comme postulé' })
    }

    const application = await Application.create({
      userId: req.user._id,
      jobOfferId,
      status: 'envoyee',
      appliedAt: new Date(),
      statusHistory: [{ status: 'envoyee', changedAt: new Date(), changedBy: 'candidat', note: 'Candidature envoyée' }],
    })

    notifyNewApplicationToRecruiter(application, await JobOffer.findById(jobOfferId))

    res.status(201).json({ application, message: 'Candidature enregistrée avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/applications/:id/send
router.post('/:id/send', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de candidature invalide' })
    }
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id })
    if (!app) return res.status(404).json({ error: 'Candidature non trouvée' })

    const emailData = (req.body && typeof req.body.email === 'object' && req.body.email !== null) ? req.body.email : {}
    const to = asString(emailData.to, { max: 320 })
    const subject = asString(emailData.subject, { max: 300 })
    const body = asString(emailData.body, { max: 20000 })
    const attachCv = !!emailData.attachCv
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Destinataire, objet et contenu de l\'email requis' })
    }

    const [jobOffer, user] = await Promise.all([
      JobOffer.findById(app.jobOfferId),
      User.findById(req.user._id),
    ])

    const recipientName = jobOffer?.recruiterName || 'Recruteur'
    const company = jobOffer?.company || ''
    const candidateName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()

    const attachments = []
    if (attachCv) {
      const cv = await CV.findOne({ userId: req.user._id, isActive: true })
      if (cv && cv.fileData) {
        const rawBase64 = cv.fileData.startsWith('data:') ? cv.fileData.split(',')[1] : cv.fileData
        attachments.push({
          filename: cv.originalName || 'CV.pdf',
          content: Buffer.from(rawBase64, 'base64'),
          contentType: cv.mimeType || 'application/pdf',
        })
      }
    }

    const safeRecipient = escapeHtml(recipientName) + (company ? ` (${escapeHtml(company)})` : '')
    const content = `
      <p style="margin:0 0 8px 0; font-size:14px; color:#334155; line-height:1.6;">Bonjour <strong>${safeRecipient}</strong>,</p>
      <p style="margin:0 0 20px 0; font-size:14px; color:#334155; line-height:1.6;">Vous avez reçu une nouvelle candidature via EasyJob :</p>
      <div style="background:#eff6ff; border-left:4px solid #2563eb; border-radius:12px; padding:18px 20px; margin:0 0 6px 0; white-space:pre-wrap; color:#334155; font-size:14px; line-height:1.7;">${escapeHtml(body)}</div>
      <p style="margin:14px 0 0 0; font-size:13px; color:#94a3b8; line-height:1.6;">Candidature envoyée par <strong>${escapeHtml(candidateName)}</strong></p>
    `
    const html = brandLayout({
      title: 'Nouvelle candidature reçue',
      content,
      footerText: 'Candidature envoyée via EasyJob — Votre carrière au Maroc',
    })
    const emailResult = await sendEmail({ to, subject, html, attachments })

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email', details: emailResult.error })
    }

    app.status = 'envoyee'
    app.appliedAt = new Date()
    app.email = {
      to,
      subject,
      body,
      attachCv: !!attachCv,
      messageId: emailResult.messageId,
      sentAt: new Date(),
    }
    if (!app.statusHistory) app.statusHistory = []
    app.statusHistory.push({ status: 'envoyee', changedAt: new Date(), changedBy: 'candidat', note: 'Candidature envoyée' })
    await app.save()

    if (jobOffer) {
      notifyNewApplicationToRecruiter(app, jobOffer)
      // Recruteur local (offre publiée sur la plateforme) -> copie "reçu"
      const recruiterUser = await User.findById(jobOffer.postedBy || jobOffer.userId)
      const recorded = await recordCandidateEmail({
        candidate: user,
        recruiterUser: recruiterUser && recruiterUser.role === 'recruiter' ? recruiterUser : null,
        application: app,
        jobOffer,
        to,
        subject,
        body,
        messageId: emailResult.messageId,
      })
      if (recruiterUser && recruiterUser.role === 'recruiter') {
        const receivedCopy = Array.isArray(recorded) ? recorded.find(d => d.userId?.toString() === recruiterUser._id.toString()) : null
        notifyEmailReceived({
          userId: recruiterUser._id,
          fromName: candidateName,
          companyName: company,
          subject,
          emailId: receivedCopy?._id?.toString() || null,
        })
      }
    }

    res.json({ application: app, message: 'Candidature envoyée avec succès !', messageId: emailResult.messageId })
  } catch (error) {
    console.error('Erreur envoi candidature:', error)
    res.status(500).json({ error: 'Erreur lors de l\'envoi' })
  }
})

// PUT /api/applications/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de candidature invalide' })
    }
    // Allowlist stricte : le corps était appliqué tel quel en `$set`, ce qui
    // permettait à l'appelant d'écrire `userId` (transférer sa candidature) ou
    // `status` sans passer par l'historique ni la route dédiée.
    const updates = pick(req.body, APPLICATION_EDITABLE_FIELDS)
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucun champ modifiable fourni' })
    }
    if (updates.status !== undefined && !APPLICATION_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    )
    if (!app) return res.status(404).json({ error: 'Candidature non trouvée' })
    res.json({ application: app, message: 'Candidature mise à jour' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/applications/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de candidature invalide' })
    }
    const status = (req.body || {}).status
    const allowedStatuses = APPLICATION_STATUSES
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }
    const app = await Application.findById(req.params.id)
    if (!app || app.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: 'Candidature non trouvée' })
    }
    const oldStatus = app.status
    app.status = status
    if (!app.statusHistory) app.statusHistory = []
    app.statusHistory.push({ status, changedAt: new Date(), changedBy: 'candidat', note: `Statut mis à jour: ${status}` })
    await app.save()

    notifyApplicationStatusChange(app, oldStatus, status, 'candidat')

    res.json({ application: app, message: 'Statut mis à jour' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/applications/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de candidature invalide' })
    }
    // Le DELETE renvoyait 200 même quand rien n'avait été supprimé (mauvais id,
    // candidature d'autrui) : l'UI display « supprimée » à tort. 404 sinon.
    const deleted = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ error: 'Candidature non trouvée' })
    res.json({ message: 'Candidature supprimée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
