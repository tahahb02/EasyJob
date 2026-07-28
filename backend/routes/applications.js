import express from 'express'
import Application from '../models/Application.js'
import JobOffer from '../models/JobOffer.js'
import User from '../models/User.js'
import { protect } from '../middlewares/auth.js'
import {
  notifyApplicationStatusChange,
  notifyNewApplicationToRecruiter
} from '../services/NotificationService.js'

const router = express.Router()

// GET /api/applications
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const query = { userId: req.user._id }
    if (status && status !== 'all') query.status = status

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [applications, total] = await Promise.all([
      Application.find(query).populate('jobOfferId', 'title company location contractType source sourceUrl').sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Application.countDocuments(query),
    ])
    res.json({ applications, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/applications/:id
router.get('/:id', protect, async (req, res) => {
  try {
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
    const { jobOfferId } = req.body
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

    const jobOffer = await JobOffer.findById(jobOfferId)
    if (jobOffer) {
      notifyNewApplicationToRecruiter(application, jobOffer)
    }

    res.status(201).json({ application, message: 'Candidature enregistrée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

// POST /api/applications/mark-applied - Quick mark as applied
router.post('/mark-applied', protect, async (req, res) => {
  try {
    const { jobOfferId } = req.body
    if (!jobOfferId) return res.status(400).json({ error: 'jobOfferId requis' })

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

    const jobOffer = await JobOffer.findById(jobOfferId)
    if (jobOffer) {
      notifyNewApplicationToRecruiter(application, jobOffer)
    }

    res.status(201).json({ application, message: 'Candidature enregistrée avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/applications/:id/send
router.post('/:id/send', protect, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id })
    if (!app) return res.status(404).json({ error: 'Candidature non trouvée' })

    app.status = 'envoyee'
    app.appliedAt = new Date()
    if (!app.statusHistory) app.statusHistory = []
    app.statusHistory.push({ status: 'envoyee', changedAt: new Date(), changedBy: 'candidat', note: 'Candidature envoyée' })
    await app.save()

    const jobOffer = await JobOffer.findById(app.jobOfferId)
    if (jobOffer) {
      notifyNewApplicationToRecruiter(app, jobOffer)
    }

    res.json({ application: app, message: 'Candidature envoyée avec succès !' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'envoi' })
  }
})

// PUT /api/applications/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const updates = req.body
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true }
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
    const { status } = req.body
    const allowedStatuses = ['brouillon', 'envoyee', 'consulte', 'valide_entretien', 'appel_attente', 'entretien_fait', 'accepte_final', 'refusee']
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
    await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    res.json({ message: 'Candidature supprimée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
