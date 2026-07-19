import express from 'express'
import JobOffer from '../models/JobOffer.js'
import Application from '../models/Application.js'
import { protect } from '../middlewares/auth.js'

const router = express.Router()

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

// GET /api/jobs/recruiter-board - Public board of recruiter-posted jobs
router.get('/recruiter-board', protect, async (req, res) => {
  try {
    const { domain, contractType, location, search, sort, page = 1, limit = 20 } = req.query
    const query = { source: 'recruiter', isActive: true }

    if (domain) query.domain = domain
    if (contractType) query.contractType = contractType
    if (location) query.location = { $regex: location, $options: 'i' }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    let sortOption = { createdAt: -1 }
    if (sort === 'date') sortOption = { postedAt: -1 }
    else if (sort === 'salary') sortOption = { 'salary.max': -1 }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [jobs, total] = await Promise.all([
      JobOffer.find(query)
        .populate('postedBy', 'firstName lastName')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      JobOffer.countDocuments(query),
    ])

    // Mark jobs where user already applied
    const appliedJobIds = await Application.find({ userId: req.user._id }).distinct('jobOfferId')
    const jobsWithStatus = jobs.map(job => ({
      ...job.toObject(),
      hasApplied: appliedJobIds.some(id => id.toString() === job._id.toString()),
    }))

    res.json({ jobs: jobsWithStatus, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (error) {
    console.error('Recruiter board error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/saved', protect, async (req, res) => {
  try {
    const jobs = await JobOffer.find({ userId: req.user._id, isSaved: true, isActive: true }).sort({ updatedAt: -1 })
    res.json({ jobs })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

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

router.get('/:id', protect, async (req, res) => {
  try {
    const job = await JobOffer.findOne({ _id: req.params.id, userId: req.user._id })
    if (!job) return res.status(404).json({ error: 'Offre non trouvée' })
    res.json({ job })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    const job = await JobOffer.create({ ...req.body, userId: req.user._id, source: 'manual' })
    res.status(201).json({ job, message: 'Offre créée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

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

// Apply to a recruiter job from candidate side
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const job = await JobOffer.findOne({ _id: req.params.id, source: 'recruiter', isActive: true })
    if (!job) return res.status(404).json({ error: 'Offre non trouvée' })

    const existing = await Application.findOne({ userId: req.user._id, jobOfferId: job._id })
    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà postulé à cette offre' })
    }

    const application = await Application.create({
      userId: req.user._id,
      jobOfferId: job._id,
      status: 'envoyee',
      coverLetter: req.body.coverLetter || '',
      appliedAt: new Date(),
    })

    job.applicationsCount = (job.applicationsCount || 0) + 1
    await job.save()

    res.status(201).json({ application, message: 'Candidature envoyée avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la candidature' })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    await JobOffer.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    res.json({ message: 'Offre supprimée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
