import express from 'express'
import Notification from '../models/Notification.js'
import { protect } from '../middlewares/auth.js'

const router = express.Router()

// GET /api/notifications
router.get('/', protect, async (req, res) => {
  try {
    const { type, unreadOnly } = req.query
    const query = { userId: req.user._id }
    if (type) query.type = type
    if (unreadOnly === 'true') query.isRead = false

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50)
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false })
    
    res.json({ notifications, unreadCount })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/notifications/read-all (must be before /:id/read)
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true })
    res.json({ message: 'Toutes les notifications marquées comme lues' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    )
    if (!notif) return res.status(404).json({ error: 'Notification non trouvée' })
    res.json({ notification: notif })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
