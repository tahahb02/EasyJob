import express from 'express'
import SearchProfile from '../models/SearchProfile.js'
import { protect } from '../middlewares/auth.js'
import { isValidObjectId, pick, SEARCH_PROFILE_EDITABLE_FIELDS } from '../utils/validation.js'

const router = express.Router()

// GET /api/search-profiles
router.get('/', protect, async (req, res) => {
  try {
    const profiles = await SearchProfile.find({ userId: req.user._id }).sort({ updatedAt: -1 })
    res.json({ profiles })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/search-profiles/:id
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de profil invalide' })
    }
    const profile = await SearchProfile.findOne({ _id: req.params.id, userId: req.user._id })
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' })
    res.json({ profile })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/search-profiles
router.post('/', protect, async (req, res) => {
  try {
    // Allowlist + userId forcé après le spread : le client ne peut plus changer
    // le propriétaire du profil qu'il crée.
    const profile = await SearchProfile.create({ ...pick(req.body, SEARCH_PROFILE_EDITABLE_FIELDS), userId: req.user._id })
    res.status(201).json({ profile, message: 'Profil de recherche créé' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

// PUT /api/search-profiles/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de profil invalide' })
    }
    // Le corps entier était appliqué tel quel : `userId` était modifiable.
    const updates = pick(req.body, SEARCH_PROFILE_EDITABLE_FIELDS)
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucun champ modifiable fourni' })
    }
    const profile = await SearchProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    )
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' })
    res.json({ profile, message: 'Profil mis à jour' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/search-profiles/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de profil invalide' })
    }
    // 404 si rien n'a été supprimé (id inexistant ou profil d'autrui) : le 200
    // précédent affichait « supprimé » alors que rien n'avait bougé.
    const deleted = await SearchProfile.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ error: 'Profil non trouvé' })
    res.json({ message: 'Profil supprimé' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/search-profiles/:id/activate
router.post('/:id/activate', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant de profil invalide' })
    }
    const profile = await SearchProfile.findOne({ _id: req.params.id, userId: req.user._id })
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' })
    profile.isActive = !profile.isActive
    await profile.save()
    res.json({ profile, message: profile.isActive ? 'Profil activé' : 'Profil désactivé' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
