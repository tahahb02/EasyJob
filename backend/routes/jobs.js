import express from 'express'
import JobOffer from '../models/JobOffer.js'
import PublicNews from '../models/PublicNews.js'
import Application from '../models/Application.js'
import UserProfile from '../models/UserProfile.js'
import { protect } from '../middlewares/auth.js'
import { notifyNewJobOffer, notifyNewApplicationToRecruiter } from '../services/NotificationService.js'
import { calculateCandidateMatch, SITE_SOURCES, CONCOURS_SOURCE, PUBLIC_SOURCES } from '../services/jobScraper.js'
import { buildCandidateInfo } from '../services/candidateInfo.js'
import { escapeRegExp, clampInt, isValidObjectId, pick } from '../utils/validation.js'

// Champs qu'un candidat peut fournir à `POST /api/jobs`. Tout le reste (y
// compris `userId`, `source`, `viewsCount`, `applicationsCount`) est ignoré.
const JOB_CREATION_FIELDS = [
  'title',
  'company',
  'companyLogo',
  'companyUrl',
  'location',
  'isRemote',
  'contractType',
  'description',
  'requirements',
  'responsibilities',
  'salary',
  'salaryText',
  'city',
  'experience',
  'education',
  'reference',
  'nbPostes',
  'applicationDeadline',
  'sector',
  'domain',
  'keywords',
]

const router = express.Router()

router.get('/', protect, async (req, res) => {
  try {
    const { search, contractType, location, source, group, sort, page, limit } = req.query

    const query = { userId: req.user._id, isActive: true }

    if (search) {
      // Regex échappée : `search` était injecté tel quel dans `$regex`, ce qui
      // laisse l'utilisateur déclencher un ReDoS avec un motif catastrophique.
      const safe = new RegExp(escapeRegExp(search), 'i')
      query.$or = [
        { title: safe },
        { company: safe },
        { description: safe },
      ]
    }
    if (contractType) query.contractType = contractType
    if (location) query.location = new RegExp(escapeRegExp(location), 'i')
    // Séparation : le secteur public (source 'concours' et 'emploi-public') vit sur
    // l'onglet « Emplois publics & Concours », les offres scrapées des sites externes
    // sur l'onglet des offres externes ; ils ne se mélangent jamais.
    if (source && source !== 'Toutes') {
      query.source = source
    } else if (group === 'sites') {
      query.source = { $in: SITE_SOURCES }
    } else if (group === 'public') {
      query.source = { $in: PUBLIC_SOURCES }
    } else if (group === 'concours') {
      query.source = CONCOURS_SOURCE
    } else {
      // Vue par défaut (offres externes) : exclure TOUT le secteur public
      // (concours ET emplois publics), jamais mélangés avec les sites externes.
      query.source = { $nin: PUBLIC_SOURCES }
    }

    let sortOption = { relevanceScore: -1, postedAt: -1, createdAt: -1 }
    if (sort === 'date') sortOption = { postedAt: -1, createdAt: -1 }
    else if (sort === 'salary') sortOption = { 'salary.max': -1, postedAt: -1, createdAt: -1 }

    // Pagination bornée : `?limit=1000000` était passé tel quel à `.limit()`.
    const currentPage = clampInt(page, { min: 1, max: 10000, fallback: 1 })
    const perPage = clampInt(limit, { min: 1, max: 100, fallback: 20 })
    const skip = (currentPage - 1) * perPage
    const [jobs, total] = await Promise.all([
      JobOffer.find(query).sort(sortOption).skip(skip).limit(perPage),
      JobOffer.countDocuments(query),
    ])

    res.json({ jobs, total, page: currentPage, pages: Math.ceil(total / perPage) })
  } catch (error) {
    console.error('Erreur jobs list:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des offres' })
  }
})

// GET /api/jobs/recruiter-board - Public board of recruiter-posted jobs
router.get('/recruiter-board', protect, async (req, res) => {
  try {
    const { domain, contractType, location, search, sort, matched, page, limit } = req.query
    const query = { source: 'recruiter', isActive: true }

    if (domain) query.domain = domain
    if (contractType) query.contractType = contractType
    if (location) query.location = new RegExp(escapeRegExp(location), 'i')
    if (search) {
      const safe = new RegExp(escapeRegExp(search), 'i')
      query.$or = [
        { title: safe },
        { company: safe },
        { description: safe },
      ]
    }

    let sortOption = { createdAt: -1 }
    if (sort === 'date') sortOption = { postedAt: -1 }
    else if (sort === 'salary') sortOption = { 'salary.max': -1 }

    // Fetch all matching offers, then score and paginate in memory so that
    // relevance ordering does not hide offers on later pages.
    const jobs = await JobOffer.find(query)
      .populate('postedBy', 'firstName lastName company')
      .sort(sortOption)
      .limit(500)
    const totalUnfiltered = jobs.length

    const appliedJobIds = await Application.find({ userId: req.user._id }).distinct('jobOfferId')

    // Profile matching: offers are shown according to the candidate's profile
    const profile = await UserProfile.findOne({ userId: req.user._id })
    const hasProfile = profile && (
      (profile.skills || []).length > 0 ||
      (profile.domains || []).length > 0 ||
      (profile.experience || []).length > 0 ||
      (profile.title || '').trim() !== ''
    )

    const jobsWithStatus = jobs.map(job => {
      const jobObj = job.toObject()
      let matchScore = 0
      if (profile && hasProfile) {
        matchScore = calculateCandidateMatch(profile, jobObj)
      }
      return {
        ...jobObj,
        matchScore,
        hasApplied: appliedJobIds.some(id => id.toString() === job._id.toString()),
      }
    })

    // Show all active recruiter offers; when the candidate has a profile,
    // order them by relevance instead of hiding low-match offers.
    let visibleJobs = jobsWithStatus
    if (profile && hasProfile && matched !== 'false') {
      visibleJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    }

    const total = visibleJobs.length
    const currentPage = clampInt(page, { min: 1, max: 10000, fallback: 1 })
    const perPage = clampInt(limit, { min: 1, max: 100, fallback: 20 })
    const skip = (currentPage - 1) * perPage
    const paginatedJobs = visibleJobs.slice(skip, skip + perPage)

    res.json({
      jobs: paginatedJobs,
      total,
      totalUnfiltered,
      profileMatched: !!(profile && hasProfile),
      page: currentPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    })
  } catch (error) {
    console.error('Recruiter board error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/saved', protect, async (req, res) => {
  try {
    const jobs = await JobOffer.find({ userId: req.user._id, isSaved: true, isActive: true, source: { $ne: 'concours' } }).sort({ updatedAt: -1 })
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
      source: { $ne: 'concours' },
      relevanceScore: { $gte: 70 } 
    }).sort({ relevanceScore: -1 }).limit(10)
    res.json({ jobs })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/jobs/public-sector - Offres du secteur public (concours + emplois publics)
// ET news / infos de l'État + concours prochains, triés séparément.
router.get('/public-sector', protect, async (req, res) => {
  try {
    const { search, category, page, limit, sort = 'date' } = req.query

    const query = { userId: req.user._id, isActive: true, source: { $in: PUBLIC_SOURCES } }
    if (search) {
      const safe = new RegExp(escapeRegExp(search), 'i')
      query.$or = [
        { title: safe },
        { company: safe },
        { description: safe },
      ]
    }

    const sortOption = sort === 'relevance'
      ? { relevanceScore: -1, postedAt: -1, createdAt: -1 }
      : { postedAt: -1, createdAt: -1 }

    const currentPage = clampInt(page, { min: 1, max: 10000, fallback: 1 })
    const perPage = clampInt(limit, { min: 1, max: 100, fallback: 20 })
    const skip = (currentPage - 1) * perPage
    const [jobs, total] = await Promise.all([
      JobOffer.find(query).sort(sortOption).skip(skip).limit(perPage),
      JobOffer.countDocuments(query),
    ])

    const newsQuery = { userId: req.user._id }
    if (category) newsQuery.category = category
    const newsList = await PublicNews.find(newsQuery).sort({ postedAt: -1 }).limit(40)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Tri : concours prochains (date d'examen à venir, croissante) d'abord,
    // puis infos urgentes, puis actualités (récentes d'abord).
    const categoryRank = { 'concours-prochain': 0, info: 1, actualite: 2 }
    const news = newsList
      .filter(n => n.category !== 'concours-prochain' || (n.eventDate && new Date(n.eventDate) >= today))
      .sort((a, b) => {
        const ra = categoryRank[a.category] ?? 3
        const rb = categoryRank[b.category] ?? 3
        if (ra !== rb) return ra - rb
        if (a.category === 'concours-prochain') return new Date(a.eventDate) - new Date(b.eventDate)
        return new Date(b.postedAt) - new Date(a.postedAt)
      })

    res.json({ jobs, news, total, page: currentPage, pages: Math.ceil(total / perPage) })
  } catch (error) {
    console.error('Erreur secteur public:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du secteur public' })
  }
})

router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant d\'offre invalide' })
    }
    const job = await JobOffer.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { source: 'recruiter' },
      ]
    }).populate('postedBy', 'firstName lastName company email phone')
    if (!job) return res.status(404).json({ error: 'Offre non trouvée' })

    const hasApplied = await Application.exists({ userId: req.user._id, jobOfferId: job._id })

    res.json({ job: { ...job.toObject(), hasApplied: !!hasApplied } })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.post('/', protect, async (req, res) => {
  try {
    // `source` et `userId` sont forcés : le corps ne pouvait pas les remplacer
    // (sinon une offre « manual » pouvait se faire passer pour une offre
    // recruteur, donc apparaître sur le tableau public des recruteurs).
    const job = await JobOffer.create({ ...pick(req.body, JOB_CREATION_FIELDS), userId: req.user._id, source: 'manual' })

    notifyNewJobOffer(job)

    res.status(201).json({ job, message: 'Offre créée' })
  } catch (error) {
    // Un `contractType` hors enum (ex. "CDI/CDD") partait en 500 sans message
    // exploitable : on renvoie la liste des valeurs acceptées.
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: Object.values(error.errors || {}).map(e => e.message).join(', ') || 'Offre invalide',
      })
    }
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

router.post('/:id/save', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant d\'offre invalide' })
    }
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
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant d\'offre invalide' })
    }
    const job = await JobOffer.findOne({ _id: req.params.id, source: 'recruiter', isActive: true })
    if (!job) return res.status(404).json({ error: 'Offre non trouvée' })

    const existing = await Application.findOne({ userId: req.user._id, jobOfferId: job._id })
    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà postulé à cette offre' })
    }

    const candidateInfo = await buildCandidateInfo(req.user._id, job)

    const application = await Application.create({
      userId: req.user._id,
      jobOfferId: job._id,
      status: 'envoyee',
      coverLetter: req.body.coverLetter || '',
      appliedAt: new Date(),
      statusHistory: [{ status: 'envoyee', changedAt: new Date(), changedBy: 'candidat', note: 'Candidature envoyée' }],
      candidateInfo,
    })

    job.applicationsCount = (job.applicationsCount || 0) + 1
    await job.save()

    notifyNewApplicationToRecruiter(application, job)

    res.status(201).json({ application, message: 'Candidature envoyée avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la candidature' })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Identifiant d\'offre invalide' })
    }
    // 404 si rien n'est supprimé (id inexistant ou offre d'autrui) : le 200
    // précédent était un faux succès affiché à l'utilisateur.
    const deleted = await JobOffer.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ error: 'Offre non trouvée' })
    res.json({ message: 'Offre supprimée' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
