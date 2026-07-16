import express from 'express'
import EmailTemplate from '../models/EmailTemplate.js'
import { protect } from '../middlewares/auth.js'

const router = express.Router()

// GET /api/emails/templates
router.get('/templates', protect, async (req, res) => {
  try {
    const templates = await EmailTemplate.find({
      $or: [{ userId: req.user._id }, { isDefault: true }]
    }).sort({ isDefault: -1, name: 1 })
    res.json({ templates })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/emails/templates
router.post('/templates', protect, async (req, res) => {
  try {
    const template = await EmailTemplate.create({ ...req.body, userId: req.user._id })
    res.status(201).json({ template, message: 'Template créé' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

// PUT /api/emails/templates/:id
router.put('/templates/:id', protect, async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    )
    if (!template) return res.status(404).json({ error: 'Template non trouvé' })
    res.json({ template, message: 'Template mis à jour' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/emails/templates/:id
router.delete('/templates/:id', protect, async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!template) return res.status(404).json({ error: 'Template non trouvé' })
    res.json({ message: 'Template supprimé' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/emails/preview
router.post('/preview', protect, async (req, res) => {
  try {
    const { subject, body, variables } = req.body
    let renderedSubject = subject
    let renderedBody = body
    for (const [key, value] of Object.entries(variables || {})) {
      renderedSubject = renderedSubject.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
      renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
    }
    res.json({ subject: renderedSubject, body: renderedBody })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
