import express from 'express'
import JobOffer from '../models/JobOffer.js'
import PublicNews from '../models/PublicNews.js'
import ScrapingLog from '../models/ScrapingLog.js'
import UserProfile from '../models/UserProfile.js'
import SearchProfile from '../models/SearchProfile.js'
import CV from '../models/CV.js'
import User from '../models/User.js'
import { protect } from '../middlewares/auth.js'
import { scrapeAllSources, scrapePublicSector, SITE_SOURCES, CONCOURS_SOURCE, PUBLIC_SOURCES } from '../services/jobScraper.js'
import { notifyScrapingComplete } from '../services/NotificationService.js'
import { getIO } from '../services/socketManager.js'

const router = express.Router()

function emitToUser(userId, event, payload) {
  const io = getIO()
  if (io) {
    io.to(`user:${userId}`).emit(event, payload)
  }
}

async function runScrapingJob(userId, logId, keywords, location, enabledSources, userProfile) {
  try {
    const results = {}
    let publicNews = []
    const startOverall = Date.now()

    // Le secteur public (concours + emplois publics) est scrappé séparément des
    // sites externes : il renvoie en plus les news / infos de l'État et les
    // concours prochains, persistés dans PublicNews.
    const siteSources = enabledSources.filter(s => !PUBLIC_SOURCES.includes(s))
    const wantsPublic = enabledSources.some(s => PUBLIC_SOURCES.includes(s))

    if (wantsPublic) {
      try {
        const { jobs, news } = await scrapePublicSector(userProfile)
        publicNews = news || []
        for (const src of PUBLIC_SOURCES) {
          const srcJobs = (jobs || []).filter(j => j.source === src)
          results[src] = {
            jobs: srcJobs,
            status: srcJobs.length > 0 ? 'success' : 'partial',
            duration: Date.now() - startOverall,
          }
          const stats = {
            source: src,
            status: results[src].status,
            offersFound: srcJobs.length,
            newOffers: 0,
            duplicatesSkipped: 0,
            duration: results[src].duration,
            errors: [],
          }
          await ScrapingLog.updateOne(
            { _id: logId, 'sources.source': src },
            { $set: { 'sources.$': stats } }
          )
          emitToUser(userId, 'scraping:update', { runId: logId, ...stats })
        }
      } catch (error) {
        console.error('Secteur public scraping error:', error.message)
        const src = 'emploi-public'
        results[src] = { jobs: [], status: 'failed', duration: Date.now() - startOverall, error: error.message }
        const stats = {
          source: src,
          status: 'failed',
          offersFound: 0,
          newOffers: 0,
          duplicatesSkipped: 0,
          duration: Date.now() - startOverall,
          errors: [error.message],
        }
        await ScrapingLog.updateOne(
          { _id: logId, 'sources.source': src },
          { $set: { 'sources.$': stats } }
        )
        emitToUser(userId, 'scraping:update', { runId: logId, ...stats })
      }
    }

    if (siteSources.length) {
      const siteResults = await scrapeAllSources(keywords, location, siteSources, userProfile, async (source, result) => {
        const stats = {
          source,
          status: result.status,
          offersFound: (result.jobs || []).length,
          newOffers: 0,
          duplicatesSkipped: 0,
          duration: result.duration,
          errors: result.error ? [result.error] : [],
        }
        await ScrapingLog.updateOne(
          { _id: logId, 'sources.source': source },
          { $set: { 'sources.$': stats } }
        )
        emitToUser(userId, 'scraping:update', { runId: logId, ...stats })
      })
      Object.assign(results, siteResults)
    }

    const createdJobs = []
    const sourceStats = []

    for (const [sourceName, result] of Object.entries(results)) {
      if (!enabledSources.includes(sourceName)) continue
      let newOffers = 0
      for (const jobData of result.jobs) {
        try {
          const existing = await JobOffer.findOne({
            userId,
            source: jobData.source,
            title: jobData.title,
            company: jobData.company,
          })
          if (!existing) {
            const job = await JobOffer.create({
              ...jobData,
              userId,
              scrapedAt: new Date(),
              sourceId: jobData.sourceId || `scrape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              postedAt: jobData.postedAt || new Date(),
            })
            createdJobs.push(job)
            newOffers++
          }
        } catch (e) {
          // skip duplicates
        }
      }
      sourceStats.push({
        source: sourceName,
        status: result.status,
        offersFound: result.jobs.length,
        newOffers,
        duplicatesSkipped: result.jobs.length - newOffers,
        duration: result.duration,
        errors: result.error ? [result.error] : [],
      })
    }

    // News du secteur public (actualités, infos urgentes, concours prochains)
    let newNews = 0
    for (const item of publicNews) {
      try {
        const existing = await PublicNews.findOne({ userId, sourceId: item.sourceId })
        if (!existing) {
          await PublicNews.create({ ...item, userId })
          newNews++
        }
      } catch (e) {
        // skip duplicates
      }
    }

    const log = await ScrapingLog.findById(logId)
    if (!log) return

    log.status = 'success'
    log.sources = sourceStats
    log.totalOffersFound = sourceStats.reduce((sum, s) => sum + s.offersFound, 0)
    log.totalNewOffers = createdJobs.length
    log.completedAt = new Date()
    await log.save()

    notifyScrapingComplete(userId, {
      count: createdJobs.length,
      source: enabledSources.join(', '),
      jobs: createdJobs,
    })

    emitToUser(userId, 'scraping:done', {
      runId: logId,
      status: 'success',
      totalOffersFound: log.totalOffersFound,
      totalNewOffers: createdJobs.length,
      newNews,
      sources: sourceStats,
    })
  } catch (error) {
    console.error('Erreur scraping:', error)
    try {
      const log = await ScrapingLog.findById(logId)
      if (log) {
        log.status = 'failed'
        log.sources = (log.sources || []).map(s => ({
          ...s.toObject ? s.toObject() : s,
          status: s.status === 'running' ? 'failed' : s.status,
        }))
        log.completedAt = new Date()
        await log.save()
      }
    } catch (_) {
      // ignore
    }
    emitToUser(userId, 'scraping:done', {
      runId: logId,
      status: 'failed',
      error: error.message,
    })
  }
}

router.post('/run', protect, async (req, res) => {
  try {
    // Une collecte est déjà en cours pour cet utilisateur : on la renvoie telle quelle.
    const existingRunning = await ScrapingLog.findOne({ userId: req.user._id, status: 'running' })
    if (existingRunning) {
      return res.status(200).json({
        runId: existingRunning._id,
        status: 'running',
        alreadyRunning: true,
        message: 'Une collecte est déjà en cours',
      })
    }

    const { keywords, location, sources, searchProfileId } = req.body || {}

    const [profile, user, cv, searchProfiles] = await Promise.all([
      UserProfile.findOne({ userId: req.user._id }),
      User.findById(req.user._id),
      CV.findOne({ userId: req.user._id, isActive: true }),
      SearchProfile.find({ userId: req.user._id, isActive: true }).sort({ updatedAt: -1 }),
    ])

    const activeProfile = searchProfileId
      ? searchProfiles.find(p => p._id.toString() === searchProfileId)
      : searchProfiles[0] || null

    // 1) Sources : requête > profil de recherche actif > défauts
    // Les sources du secteur public (concours + emploi-public) sont isolées des
    // sites externes : elles ne sont lancées que lorsqu'elles sont explicitement
    // demandées (onglet « Emplois publics & Concours ») et vivent séparément des
    // offres scrapées des sites qui alimentent l'onglet des offres externes.
    const profileSources = activeProfile && activeProfile.sourcesConfig
      ? Object.entries(activeProfile.sourcesConfig)
          .filter(([, cfg]) => cfg && cfg.enabled)
          .map(([src]) => src)
      : []
    const enabledSources = Array.isArray(sources)
      ? sources
      : (profileSources.length > 0 ? profileSources : SITE_SOURCES)
          .filter(s => s !== CONCOURS_SOURCE)

    if (!enabledSources.length) {
      return res.status(400).json({ error: 'Aucune source de scraping sélectionnée' })
    }

    // 2) Mots-clés : requête > profil actif (keywords + customKeywords) > profil utilisateur
    const activeKeywords = activeProfile?.keywords?.length ? [...activeProfile.keywords] : []
    if (activeProfile?.sourcesConfig) {
      for (const cfg of Object.values(activeProfile.sourcesConfig)) {
        if (cfg?.customKeywords?.length) activeKeywords.push(...cfg.customKeywords)
      }
    }
    const searchKeywords = keywords
      || (activeKeywords.length > 0 ? activeKeywords : undefined)
      || profile?.searchKeywords
      || profile?.domains
      || profile?.skills
      || ['développeur', 'ingénieur', 'chef de projet']

    const searchLocation = location
      || activeProfile?.locations?.[0]
      || profile?.preferredLocations?.[0]
      || profile?.location?.city
      || 'Maroc'

    // 3) Profil enrichi par les données extraites du CV (matching optimisé)
    const cvSkills = cv?.parsedData?.skills || []
    const cvEducation = cv?.parsedData?.education || []
    const cvExperience = cv?.parsedData?.experience || []
    const cvLanguages = cv?.parsedData?.languages || []

    const userProfile = {
      skills: profile?.skills?.length ? profile.skills : cvSkills,
      softSkills: cv?.parsedData?.softSkills || [],
      domains: profile?.domains || [],
      searchKeywords,
      education: profile?.education?.length ? profile.education : cvEducation,
      experience: profile?.experience?.length ? profile.experience : cvExperience,
      languages: profile?.languages?.length ? profile.languages : cvLanguages,
      title: profile?.title || cv?.parsedData?.fullName || user?.role || '',
    }

    const log = await ScrapingLog.create({
      userId: req.user._id,
      status: 'running',
      startedAt: new Date(),
      sources: enabledSources.map(s => ({ source: s, status: 'running' })),
    })

    // Réponse immédiate : le front n'attend pas la fin du scraping.
    res.json({
      runId: log._id,
      status: 'running',
      message: 'Collecte lancée en arrière-plan',
    })

    // Exécution en arrière-plan + notifications temps réel via Socket.IO
    runScrapingJob(req.user._id, log._id, searchKeywords, searchLocation, enabledSources, userProfile)
  } catch (error) {
    console.error('Erreur scraping:', error)
    res.status(500).json({ error: 'Erreur lors du lancement du scrapping' })
  }
})

router.get('/logs', protect, async (req, res) => {
  try {
    const logs = await ScrapingLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20)
    res.json({ logs })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/status', protect, async (req, res) => {
  try {
    const { runId } = req.query
    let log = null
    if (runId) {
      log = await ScrapingLog.findOne({ userId: req.user._id, _id: runId })
    } else {
      log = await ScrapingLog.findOne({ userId: req.user._id, status: 'running' })
        || await ScrapingLog.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
    }
    res.json({ isRunning: !!(log && log.status === 'running'), log })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router