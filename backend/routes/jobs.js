import express from 'express'
import JobOffer from '../models/JobOffer.js'
import { protect } from '../middlewares/auth.js'

const router = express.Router()

// GET /api/jobs - List jobs with filters
router.get('/', protect, async (req, res) => {
  try {
    const { search, contractType, location, source, sort, page = 1, limit = 20 } = req.query
    
    const query = { userId: req.user._id, isActive: true }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    if (contractType) query.contractType = contractType
    if (location) query.location = { $regex: location, $options: 'i' }
    if (source) query.source = source

    let sortOption = { relevanceScore: -1 }
    if (sort === 'date') sortOption = { postedAt: -1 }
    else if (sort === 'salary') sortOption = { 'salary.max': -1 }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [jobs, total] = await Promise.all([
      JobOffer.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      JobOffer.countDocuments(query),
    ])

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (error) {
    console.error('Erreur jobs list:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des offres' })
  }
})

// GET /api/jobs/saved
router.get('/saved', protect, async (req, res) => {
  try {
    const jobs = await JobOffer.find({ userId: req.user._id, isSaved: true, isActive: true }).sort({ updatedAt: -1 })
    res.json({ jobs })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/jobs/recommended
router.get('/recommended', protect, async (req, res) => {
  try {
    const jobs = await JobOffer.find({ 
      userId: req.user._id, 
      isActive: true, 
      relevanceScore: { $gte: 70 } 
    }).sort({ relevanceScore: -1 }).limit(10)
    res.json({ jobs })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/jobs/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await JobOffer.findOne({ _id: req.params.id, userId: req.user._id })
    if (!job) return res.status(404).json({ error: 'Offre non trouvée' })
    res.json({ job })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/jobs - Create a job offer manually
router.post('/', protect, async (req, res) => {
  try {
    const job = await JobOffer.create({ ...req.body, userId: req.user._id, source: 'manual' })
    res.status(201).json({ job, message: 'Offre créée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

// POST /api/jobs/:id/save - Toggle save
router.post('/:id/save', protect, async (req, res) => {
  try {
    const job = await JobOffer.findOne({ _id: req.params.id, userId: req.user._id })
    if (!job) return res.status(404).json({ error: 'Offre non trouvée' })
    
    job.isSaved = !job.isSaved
    await job.save()
    
    res.json({ job, message: job.isSaved ? 'Offre sauvegardée' : 'Offre retirée des favoris' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// DELETE /api/jobs/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await JobOffer.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    res.json({ message: 'Offre supprimée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
