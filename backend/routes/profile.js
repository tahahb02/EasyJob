import express from 'express'
import mongoose from 'mongoose'
import User from '../models/User.js'
import UserProfile from '../models/UserProfile.js'
import { protect } from '../middlewares/auth.js'
import { uploadAvatar, assertFileSignature } from '../utils/fileUpload.js'
import { asString, asBool, pick, sanitizeUserProfileUpdates } from '../utils/validation.js'

const router = express.Router()

// Sous-ensemble de `User.preferences` modifiable depuis le formulaire de profil.
const PREFERENCE_FIELDS = [
  'jobSearchStatus',
  'jobType',
  'remoteOnly',
  'notifications',
  'emailNotifications',
  'language',
  'theme',
]

// GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user._id })
    if (!profile) {
      profile = await UserProfile.create({ userId: req.user._id })
    }
    let hasCV = false
    try {
      const CV = mongoose.models.CV
      if (CV) {
        const cv = await CV.findOne({ userId: req.user._id, isActive: true })
        hasCV = !!cv
      }
    } catch (_) {}
    res.json({ profile, user: req.user, hasCV })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' })
  }
})

// PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    const updates = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {}

    // Validation des types AVANT l'écriture. Le corps était appliqué tel quel
    // en `$set` : un champ au mauvais type (`languages: "x"` au lieu d'un
    // tableau) partait jusqu'à Mongoose et renvoyait 500.
    const { updates: profileData, invalid } = sanitizeUserProfileUpdates(updates)
    if (invalid.length > 0) {
      return res.status(400).json({
        error: `Champs invalides : ${invalid.join(', ')}`,
        invalidFields: invalid,
      })
    }

    const userUpdates = {}
    if (updates.firstName) userUpdates.firstName = asString(updates.firstName, { max: 120 })
    if (updates.lastName) userUpdates.lastName = asString(updates.lastName, { max: 120 })
    if (updates.phone !== undefined) userUpdates.phone = asString(updates.phone, { max: 40 })
    if (updates.preferences && typeof updates.preferences === 'object' && !Array.isArray(updates.preferences)) {
      userUpdates.preferences = pick(updates.preferences, PREFERENCE_FIELDS)
    }
    if (updates.onboardingCompleted !== undefined) userUpdates.onboardingCompleted = !!asBool(updates.onboardingCompleted)

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, userUpdates)
    }

    if (updates.city !== undefined) {
      profileData.location = { ...(profileData.location || {}), city: asString(updates.city, { max: 120 }) }
    }

    if (Object.keys(profileData).length === 0 && Object.keys(userUpdates).length === 0) {
      return res.status(400).json({ error: 'Aucun champ modifiable fourni' })
    }

    const profile = Object.keys(profileData).length > 0
      ? await UserProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $set: profileData },
        { new: true, upsert: true, runValidators: true }
      )
      : await UserProfile.findOne({ userId: req.user._id })

    const user = await User.findById(req.user._id)
    res.json({ profile, user, message: 'Profil mis à jour' })
  } catch (error) {
    console.error('Erreur profile update:', error)
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Données de profil invalides' })
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' })
  }
})

// POST /api/profile/onboarding
router.post('/onboarding', protect, async (req, res) => {
  try {
    const { domains, searchKeywords, jobTypes, preferredLocations, title } = req.body

    const parsedDomains = domains ? (typeof domains === 'string' ? JSON.parse(domains) : domains) : []
    const parsedKeywords = searchKeywords ? (typeof searchKeywords === 'string' ? JSON.parse(searchKeywords) : searchKeywords) : []
    const parsedJobTypes = jobTypes ? (typeof jobTypes === 'string' ? JSON.parse(jobTypes) : jobTypes) : []
    const parsedLocations = preferredLocations ? (typeof preferredLocations === 'string' ? JSON.parse(preferredLocations) : preferredLocations) : []

    let profile = await UserProfile.findOne({ userId: req.user._id })
    if (!profile) {
      profile = await UserProfile.create({ userId: req.user._id })
    }

    profile.domains = parsedDomains
    profile.searchKeywords = parsedKeywords
    profile.jobTypes = parsedJobTypes
    profile.preferredLocations = parsedLocations
    if (title) profile.title = title
    await profile.save()

    await User.findByIdAndUpdate(req.user._id, { onboardingCompleted: true })

    res.json({ message: 'Profil complété avec succès', profile })
  } catch (error) {
    console.error('Erreur onboarding:', error)
    res.status(500).json({ error: 'Erreur lors de la configuration du profil' })
  }
})

// GET /api/profile/onboarding-status
router.get('/onboarding-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const profile = await UserProfile.findOne({ userId: req.user._id })
    res.json({
      onboardingCompleted: user.onboardingCompleted || false,
      hasProfile: !!profile,
      hasDomains: profile?.domains?.length > 0,
      hasKeywords: profile?.searchKeywords?.length > 0,
    })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/profile/avatar
router.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' })
    if (!assertFileSignature(req, res, 'avatar')) return

    // L'avatar est stocké en base64 dans le document User (+33 % de volume).
    // La limite est passée de 10 Mo à 2 Mo : au-delà, l'update du User
    // dépassait le plafond BSON de 16 Mo et le compte devenait inutilisable.
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    await User.findByIdAndUpdate(req.user._id, { avatar: base64 })

    res.json({ avatar: base64, message: 'Avatar mis à jour' })
  } catch (error) {
    console.error('Erreur upload avatar:', error)
    res.status(500).json({ error: 'Erreur lors de l\'upload' })
  }
})

export default router
