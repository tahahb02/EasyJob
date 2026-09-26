import express from 'express'
import mongoose from 'mongoose'
import crypto from 'crypto'
import User from '../models/User.js'
import UserProfile from '../models/UserProfile.js'
import RecruiterProfile from '../models/RecruiterProfile.js'
import JobOffer from '../models/JobOffer.js'
import Application from '../models/Application.js'
import CompanyEmail from '../models/CompanyEmail.js'
import CV from '../models/CV.js'
import Email from '../models/Email.js'
import Notification from '../models/Notification.js'
import SearchProfile from '../models/SearchProfile.js'
import PublicNews from '../models/PublicNews.js'
import Recruiter from '../models/Recruiter.js'
import { protect, authorize } from '../middlewares/auth.js'

const router = express.Router()

router.use(protect, authorize('admin'))

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date) {
  const d = startOfDay(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1)
}

async function countRegistrations(from, to, roles) {
  if (!from) return 0
  const query = { createdAt: { $gte: from } }
  if (to) query.createdAt.$lt = to
  if (roles) query.role = roles
  return User.countDocuments(query)
}

// ─── GET /api/admin/overview ─────────────────────────────────────
// KPIs temps réel : utilisateurs, recruteurs, entreprises partenaires,
// offres, candidatures, comptes actifs, dernières connexions.
router.get('/overview', async (req, res) => {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const yearStart = startOfYear(now)

    const [
      totalUsers, totalCandidates, totalRecruiters, totalAdmins,
      activeAccounts, verifiedAccounts,
      totalCompanies, partnerCompanies,
      totalJobs, activeJobs, totalApplications,
      candidatesToday, candidatesWeek, candidatesMonth, candidatesYear,
      recruitersToday, recruitersWeek, recruitersMonth, recruitersYear,
      totalUsersToday, totalUsersWeek, totalUsersMonth, totalUsersYear,
      recentUsers, recentJobs, jobsBySector,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'candidat' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      RecruiterProfile.countDocuments({}),
      CompanyEmail.countDocuments({ isActive: true }),
      JobOffer.countDocuments({}),
      JobOffer.countDocuments({ isActive: true }),
      Application.countDocuments({}),
      countRegistrations(todayStart, null, 'candidat'),
      countRegistrations(weekStart, todayStart, 'candidat'),
      countRegistrations(monthStart, weekStart, 'candidat'),
      countRegistrations(yearStart, monthStart, 'candidat'),
      countRegistrations(todayStart, null, 'recruiter'),
      countRegistrations(weekStart, todayStart, 'recruiter'),
      countRegistrations(monthStart, weekStart, 'recruiter'),
      countRegistrations(yearStart, monthStart, 'recruiter'),
      countRegistrations(todayStart, null),
      countRegistrations(weekStart, todayStart),
      countRegistrations(monthStart, weekStart),
      countRegistrations(yearStart, monthStart),
      User.find({}).sort({ lastLogin: -1 }).limit(8).select('firstName lastName email role isActive lastLogin createdAt avatar'),
      JobOffer.find({}).sort({ createdAt: -1 }).limit(6).select('title company location contractType postedBy isActive createdAt'),
      JobOffer.aggregate([
        { $match: { source: 'recruiter' } },
        { $group: { _id: '$sector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ])

    const recruiterIds = await RecruiterProfile.find({}).select('userId')

    res.json({
      overview: {
        totalUsers, totalCandidates, totalRecruiters, totalAdmins,
        activeAccounts, verifiedAccounts,
        totalCompanies, partnerCompanies,
        totalJobs, activeJobs, totalApplications,
      },
      registrations: {
        today: candidatesToday + recruitersToday,
        week: candidatesWeek + recruitersWeek,
        month: candidatesMonth + recruitersMonth,
        year: candidatesYear + recruitersYear,
        todayTotal: totalUsersToday,
        weekTotal: totalUsersWeek,
        monthTotal: totalUsersMonth,
        yearTotal: totalUsersYear,
        candidats: {
          today: candidatesToday, week: candidatesWeek,
          month: candidatesMonth, year: candidatesYear,
        },
        recruteurs: {
          today: recruitersToday, week: recruitersWeek,
          month: recruitersMonth, year: recruitersYear,
        },
      },
      recruiterCompanyIds: recruiterIds.map(r => r.userId),
      recentUsers,
      recentJobs,
      jobsBySector: jobsBySector
        .filter(j => j._id)
        .map(j => ({ name: j._id, count: j.count })),
    })
  } catch (error) {
    console.error('Erreur admin overview:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/admin/timeline?days=30 ──────────────────────────────
// Séries temporelles quotidiennes (inscriptions par rôle, offres, candidatures).
router.get('/timeline', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90)
    const start = new Date()
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)

    const [usersAgg, jobsAgg, appsAgg] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: 1 }, candidats: { $sum: { $cond: [{ $eq: ['$role', 'candidat'] }, 1, 0] } }, recruteurs: { $sum: { $cond: [{ $eq: ['$role', 'recruiter'] }, 1, 0] } } } },
      ]),
      JobOffer.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
    ])

    const usersMap = new Map(usersAgg.map(u => [u._id, u]))
    const jobsMap = new Map(jobsAgg.map(j => [j._id, j.count]))
    const appsMap = new Map(appsAgg.map(a => [a._id, a.count]))

    const series = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      const u = usersMap.get(key) || { total: 0, candidats: 0, recruteurs: 0 }
      series.push({
        date: key,
        label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        utilisateurs: u.total,
        candidats: u.candidats,
        recruteurs: u.recruteurs,
        offres: jobsMap.get(key) || 0,
        candidatures: appsMap.get(key) || 0,
      })
    }

    res.json({
      days,
      currentTotals: {
        utilisateurs: usersMap.size ? [...usersMap.values()].reduce((s, v) => s + v.total, 0) : 0,
        candidats: usersMap.size ? [...usersMap.values()].reduce((s, v) => s + v.candidats, 0) : 0,
        recruteurs: usersMap.size ? [...usersMap.values()].reduce((s, v) => s + v.recruteurs, 0) : 0,
      },
      series,
    })
  } catch (error) {
    console.error('Erreur admin timeline:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/admin/monthly?months=12 ─────────────────────────────
router.get('/monthly', async (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months) || 12, 24)
    const start = new Date()
    start.setDate(1)
    start.setMonth(start.getMonth() - (months - 1))
    start.setHours(0, 0, 0, 0)

    const [usersAgg, jobsAgg, appsAgg] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: 1 }, candidats: { $sum: { $cond: [{ $eq: ['$role', 'candidat'] }, 1, 0] } }, recruteurs: { $sum: { $cond: [{ $eq: ['$role', 'recruiter'] }, 1, 0] } } } },
      ]),
      JobOffer.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
    ])

    const usersMap = new Map(usersAgg.map(u => [u._id, u]))
    const jobsMap = new Map(jobsAgg.map(j => [j._id, j.count]))
    const appsMap = new Map(appsAgg.map(a => [a._id, a.count]))

    const series = []
    let runningTotal = 0
    for (let i = 0; i < months; i++) {
      const d = new Date(start)
      d.setMonth(d.getMonth() + i)
      const key = d.toISOString().slice(0, 7)
      const u = usersMap.get(key) || { total: 0, candidats: 0, recruteurs: 0 }
      runningTotal += u.total
      series.push({
        month: key,
        label: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        utilisateurs: u.total,
        candidats: u.candidats,
        recruteurs: u.recruteurs,
        offres: jobsMap.get(key) || 0,
        candidatures: appsMap.get(key) || 0,
        cumul: runningTotal,
      })
    }

    res.json({ months, series })
  } catch (error) {
    console.error('Erreur admin monthly:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/admin/users ─────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { role, search, isActive } = req.query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const query = {}

    if (role && role !== 'all') query.role = role
    if (isActive === 'true') query.isActive = true
    if (isActive === 'false') query.isActive = false
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }]
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('firstName lastName email phone role avatar isActive isEmailVerified lastLogin createdAt onboardingCompleted'),
      User.countDocuments(query),
    ])

    res.json({ users, total, page, pages: Math.max(Math.ceil(total / limit), 1), limit })
  } catch (error) {
    console.error('Erreur admin users:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/admin/recruiters ────────────────────────────────────
router.get('/recruiters', async (req, res) => {
  try {
    const { search } = req.query
    const profiles = await RecruiterProfile.find({}).select('userId companyName industry companySize companyLocation companyLogo jobPostingsCount totalApplications')
    const userIds = profiles.map(p => p.userId)

    const query = { role: 'recruiter' }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }]
    }

    const users = await User.find(query).select('firstName lastName email phone isActive avatar lastLogin createdAt')

    const companiesMap = new Map(profiles.map(p => [p.userId.toString(), p]))

    const counts = await JobOffer.aggregate([
      { $match: { source: 'recruiter', postedBy: { $in: userIds } } },
      { $group: { _id: '$postedBy', jobs: { $sum: 1 }, activeJobs: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ])
    const jobsMap = new Map(counts.map(c => [c._id.toString(), c]))

    const recruiterJobIds = await JobOffer.find({ source: 'recruiter', postedBy: { $in: userIds } }).select('_id')
    const recruiterJobIdList = recruiterJobIds.map(j => j._id)
    const appsAgg = await Application.aggregate([
      { $match: { jobOfferId: { $in: recruiterJobIdList } } },
      { $lookup: { from: 'joboffers', localField: 'jobOfferId', foreignField: '_id', as: 'job' } },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$job.postedBy', count: { $sum: 1 } } },
    ])
    const appsMap = new Map(appsAgg.map(a => [a._id.toString(), a.count]))

    const recruiters = users.map(user => {
      const company = companiesMap.get(user._id.toString())
      const jobCounts = jobsMap.get(user._id.toString()) || { jobs: 0, activeJobs: 0 }
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        company: company ? {
          companyName: company.companyName,
          industry: company.industry,
          companySize: company.companySize,
          companyLocation: company.companyLocation,
          companyLogo: company.companyLogo,
          jobPostingsCount: company.jobPostingsCount,
        } : null,
        jobsCount: jobCounts.jobs,
        activeJobs: jobCounts.activeJobs,
        applicationsCount: appsMap.get(user._id.toString()) || 0,
      }
    })

    res.json({ recruiters, total: recruiters.length })
  } catch (error) {
    console.error('Erreur admin recruiters:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/admin/companies ─────────────────────────────────────
// Entreprises partenaires : profils recruteurs inscrits + annuaire entreprises.
router.get('/companies', async (req, res) => {
  try {
    const { search } = req.query

    const [recruiterProfiles, companyEmails] = await Promise.all([
      RecruiterProfile.find({}).select('userId companyName industry companySize companyLocation companyWebsite companyLogo jobPostingsCount totalApplications'),
      CompanyEmail.find({ isActive: true }).select('companyName email website sector domain companyType companySize city phone description'),
    ])

    const jobCounts = await JobOffer.aggregate([
      { $match: { source: 'recruiter' } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ])
    const jobsByCompany = new Map(jobCounts.map(j => [j._id.toLowerCase(), j.count]))

    const activeCompanies = []

    for (const profile of recruiterProfiles) {
      const user = await User.findById(profile.userId).select('firstName lastName email isActive lastLogin createdAt')
      if (!user) continue
      const companyName = profile.companyName
      if (search && !companyName.toLowerCase().includes(search.toLowerCase()) && !user.email.toLowerCase().includes(search.toLowerCase())) continue
      activeCompanies.push({
        _id: profile._id,
        companyName,
        industry: profile.industry,
        companySize: profile.companySize,
        companyLocation: profile.companyLocation,
        companyWebsite: profile.companyWebsite,
        companyLogo: profile.companyLogo,
        jobPostingsCount: profile.jobPostingsCount,
        jobsCount: jobsByCompany.get(companyName.toLowerCase()) || 0,
        totalApplications: profile.totalApplications,
        contactName: `${user.firstName} ${user.lastName}`.trim(),
        contactEmail: user.email,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        source: 'partenaire',
      })
    }

    for (const company of companyEmails) {
      if (search && !company.companyName.toLowerCase().includes(search.toLowerCase()) && !company.email.toLowerCase().includes(search.toLowerCase())) continue
      activeCompanies.push({
        _id: company._id,
        companyName: company.companyName,
        industry: company.sector,
        companySize: company.companySize,
        companyLocation: company.city,
        companyWebsite: company.website,
        companyLogo: '',
        jobsCount: jobsByCompany.get(company.companyName.toLowerCase()) || 0,
        totalApplications: 0,
        contactName: '',
        contactEmail: company.email,
        isActive: true,
        lastLogin: null,
        createdAt: company.createdAt,
        source: 'annuaire',
        companyType: company.companyType,
        domain: company.domain,
        phone: company.phone,
      })
    }

    activeCompanies.sort((a, b) => (b.jobsCount + b.jobPostingsCount) - (a.jobsCount + a.jobPostingsCount))

    res.json({ companies: activeCompanies, total: activeCompanies.length })
  } catch (error) {
    console.error('Erreur admin companies:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── GET /api/admin/jobs ──────────────────────────────────────────
router.get('/jobs', async (req, res) => {
  try {
    const { search, source, active } = req.query
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 25, 100)
    const query = {}

    if (source && source !== 'all') query.source = source
    if (active === 'true') query.isActive = true
    if (active === 'false') query.isActive = false
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [{ title: regex }, { company: regex }, { location: regex }, { sector: regex }]
    }

    const [jobs, total] = await Promise.all([
      JobOffer.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('title company location contractType sector source isActive viewsCount applicationsCount maxApplications postedBy createdAt'),
      JobOffer.countDocuments(query),
    ])

    const postedByIds = jobs.map(j => j.postedBy).filter(Boolean)
    const posters = await User.find({ _id: { $in: postedByIds } }).select('firstName lastName email')
    const postersMap = new Map(posters.map(p => [p._id.toString(), p]))

    const enriched = jobs.map(j => ({
      ...j.toObject(),
      poster: j.postedBy ? postersMap.get(j.postedBy.toString()) || null : null,
    }))

    res.json({ jobs: enriched, total, page, pages: Math.max(Math.ceil(total / limit), 1), limit })
  } catch (error) {
    console.error('Erreur admin jobs:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── POST /api/admin/users ────────────────────────────────────────
// Création de comptes (candidat, recruteur, admin) par l'administrateur.
router.post('/users', async (req, res) => {
  try {
    const body = req.body || {}
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const { password, role, companyName, industry, companySize, companyLocation, position } = body

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Prénom, nom et email sont requis' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Adresse email invalide' })
    }

    const validRoles = ['candidat', 'recruiter', 'admin']
    const userRole = validRoles.includes(role) ? role : 'candidat'

    if (userRole === 'recruiter' && !companyName) {
      return res.status(400).json({ error: 'Le nom de l\'entreprise est requis pour un recruteur' })
    }
    // `industry` est un champ requis de RecruiterProfile. Sans cette validation,
    // la création du User réussissait puis `RecruiterProfile.create` levait une
    // erreur → 500, en laissant un compte admin orphelin.
    if (userRole === 'recruiter' && !industry) {
      return res.status(400).json({ error: 'Le secteur d\'activité est requis pour un recruteur' })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ error: 'Un compte avec cet email existe déjà' })
    }

    // Mot de passe généré assez long pour passer la validation du modèle.
    const generatedPassword = typeof password === 'string' && password.length >= 8
      ? password
      : crypto.randomBytes(9).toString('hex')

    let user
    try {
      user = await User.create({
        firstName,
        lastName,
        email,
        password: generatedPassword,
        phone,
        role: userRole,
        isEmailVerified: true,
        isActive: true,
        onboardingCompleted: true,
      })
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(400).json({ error: 'Un compte avec cet email existe déjà' })
      }
      throw error
    }

    // Création du profil associé avec compensation : en cas d'échec on annule
    // le User plutôt que de laisser un compte sans profil.
    try {
      if (userRole === 'recruiter') {
        await RecruiterProfile.create({
          userId: user._id,
          companyName,
          industry,
          companySize: companySize || '11-50',
          companyLocation: companyLocation || '',
          position: position || '',
        })
      } else if (userRole === 'candidat') {
        await UserProfile.create({ userId: user._id })
      }
    } catch (profileError) {
      await User.deleteOne({ _id: user._id }).catch(() => {})
      console.error('Création profil admin échouée, compte annulé:', profileError.message)
      return res.status(400).json({ error: 'Les informations de profil sont invalides. Aucun compte n\'a été créé.' })
    }

    res.status(201).json({
      message: 'Compte créé avec succès',
      user,
      generatedPassword: !password ? generatedPassword : null,
    })
  } catch (error) {
    console.error('Erreur admin create user:', error)
    res.status(500).json({ error: 'Erreur lors de la création du compte' })
  }
})

// ─── PUT /api/admin/users/:id ─────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID invalide' })
    }

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const { isActive, role, password } = req.body

    if (req.body.resetPassword) {
      const newPassword = crypto.randomBytes(6).toString('hex')
      user.password = newPassword
      user.refreshToken = undefined
      await user.save()
      return res.json({ message: 'Mot de passe réinitialisé', user, generatedPassword: newPassword })
    }

    if (role && ['candidat', 'recruiter', 'admin'].includes(role)) {
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' })
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Impossible de rétrograder le dernier administrateur' })
        }
      }
      user.role = role
    }

    if (typeof isActive === 'boolean') {
      if (user._id.toString() === req.user._id.toString() && isActive === false) {
        return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte' })
      }
      user.isActive = isActive
      if (isActive === false) {
        user.refreshToken = null
      }
    }

    if (password && password.length >= 6) {
      user.password = password
    }

    await user.save()

    res.json({ message: 'Utilisateur mis à jour', user })
  } catch (error) {
    console.error('Erreur admin update user:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ─── DELETE /api/admin/users/:id ──────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID invalide' })
    }
    if (id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' })
      }
    }

    // Suppression en cascade des données rattachées à l'utilisateur. Sans
    // cela, les candidatures, CV, emails, notifications et profils de recherche
    // restaient en base et continuaient d'être comptés/affichés pour un compte
    // inexistant. Chaque suppression est tolérante aux modèles absents.
    const cascade = [
      ['UserProfile', () => UserProfile.deleteMany({ userId: id })],
      ['RecruiterProfile', () => RecruiterProfile.deleteMany({ userId: id })],
      ['Recruiter', () => Recruiter.deleteMany({ userId: id })],
      ['JobOffer (postedBy)', () => JobOffer.deleteMany({ postedBy: id })],
      ['JobOffer (userId)', () => JobOffer.deleteMany({ userId: id })],
      ['Application', () => Application.deleteMany({ userId: id })],
      ['CV', () => CV.deleteMany({ userId: id })],
      ['Email', () => Email.deleteMany({ userId: id })],
      ['Notification', () => Notification.deleteMany({ userId: id })],
      ['SearchProfile', () => SearchProfile.deleteMany({ userId: id })],
      ['PublicNews', () => PublicNews.deleteMany({ userId: id })],
    ]

    const results = await Promise.allSettled(cascade.map(([, run]) => run()))
    const failed = results
      .map((result, index) => (result.status === 'rejected' ? cascade[index][0] : null))
      .filter(Boolean)
    if (failed.length > 0) {
      console.warn(`Suppression admin ${id} : échecs partiels sur ${failed.join(', ')}`)
    }

    await user.deleteOne()

    res.json({ message: 'Utilisateur supprimé', partialCleanup: failed })
  } catch (error) {
    console.error('Erreur admin delete user:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router