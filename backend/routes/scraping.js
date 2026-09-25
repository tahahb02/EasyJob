import express from 'express'
import { createHash } from 'node:crypto'
import JobOffer from '../models/JobOffer.js'
import PublicNews from '../models/PublicNews.js'
import ScrapingLog from '../models/ScrapingLog.js'
import UserProfile from '../models/UserProfile.js'
import SearchProfile from '../models/SearchProfile.js'
import CV from '../models/CV.js'
import User from '../models/User.js'
import { protect } from '../middlewares/auth.js'
import {
  scrapeAllSources,
  scrapePublicSector,
  normalizeContractType,
  withScrapeBudget,
  setSourceProgressHook,
  TARGET_OFFERS_PER_SOURCE,
  SITE_SOURCES,
  CONCOURS_SOURCE,
  PUBLIC_SOURCES,
} from '../services/jobScraper.js'
import { notifyScrapingComplete } from '../services/NotificationService.js'
import { getIO } from '../services/socketManager.js'

const router = express.Router()

// 200 offres par site et par clic, comme demandé.
const MAX_OFFERS_PER_SOURCE = TARGET_OFFERS_PER_SOURCE
// Sur Vercel chaque invocation est plafonnée (60 s par défaut) : on ne tente de
// faire tenir dans une requête que ce budget de collecte, la suite est reprise à
// la requête suivante. Un serveur long-running (node backend/start.js) n'a pas
// cette contrainte et peut paginer beaucoup plus longtemps pour atteindre
// réellement 200 offres par site.
const SERVERLESS_BUDGET_MS = 40_000
const PERSISTENT_BUDGET_MS = 6 * 60 * 1000
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION)

function runBudgetMs() {
  const override = Number(process.env.SCRAPING_BUDGET_MS)
  if (override > 0) return override
  return isServerless ? SERVERLESS_BUDGET_MS : PERSISTENT_BUDGET_MS
}
const STALE_PROCESSING_MS = 5 * 60 * 1000
// Battement de cœur écrit pendant la collecte d'une source. Au-delà de ce délai
// sans activité, la collecte est considérée morte : on abandonne les sources
// restantes et on clôture la collecte à 100 % au lieu de la laisser figée.
const RUN_STALL_MS = 2 * 60 * 1000
const HEARTBEAT_MS = 20 * 1000
const STALL_REASON = 'Collecte interrompue (aucune réponse du serveur) — relancez le scrapping'
// Collectes pilotées par ce processus (serveur long-running). Le polling HTTP
// n'est plus la file de travail : il ne sert que de secours.
const drivenRuns = new Set()

const ALLOWED_SOURCES = new Set([...SITE_SOURCES, ...PUBLIC_SOURCES])
const CONTRACT_TYPES = new Set(['CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel'])

function emitToUser(userId, event, payload) {
  const io = getIO()
  if (io) io.to(`user:${userId}`).emit(event, payload)
}

function normalizeText(value) {
  return String(value || '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeKeywords(value, limit = 16) {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\n]+/) : []
  return [...new Set(values.map(item => normalizeText(item)).filter(Boolean))].slice(0, limit)
}

// Mots-clés par source : chaque site est interrogé avec son propre vocabulaire.
// Sans cela la liste globale (tronquée) écrase les mots-clés français et la
// source ne renvoie rien.
function normalizeSourceKeywords(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result = {}
  for (const [source, keywords] of Object.entries(value)) {
    if (!allowed.has(source)) continue
    const list = normalizeKeywords(keywords, 6)
    if (list.length > 0) result[source] = list
  }
  return result
}

function normalizeSources(value, fallback = []) {
  const values = Array.isArray(value) ? value : fallback
  return [...new Set(values.filter(source => ALLOWED_SOURCES.has(source)))]
}

function stableSourceId(source, job) {
  const identity = normalizeText(job.sourceUrl || job.sourceId || `${job.title}|${job.company}|${job.location}`)
  return createHash('sha1').update(`${source}|${identity}`).digest('hex')
}

function normalizeSalary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const min = Number(value.min)
  const max = Number(value.max)
  const salary = {
    currency: normalizeText(value.currency) || 'MAD',
    period: normalizeText(value.period) || 'monthly',
  }
  if (Number.isFinite(min) && min > 0) salary.min = min
  if (Number.isFinite(max) && max > 0) salary.max = max
  return Object.keys(salary).length > 2 ? salary : null
}

function normalizeJobData(userId, sourceName, jobData) {
  const title = normalizeText(jobData?.title)
  if (!title) return null

  const source = ALLOWED_SOURCES.has(jobData?.source) ? jobData.source : sourceName
  const company = normalizeText(jobData?.company) || 'Non spécifié'
  const location = normalizeText(jobData?.location) || 'Maroc'
  const description = normalizeText(jobData?.description).slice(0, 8000)
  const requirements = Array.isArray(jobData?.requirements)
    ? jobData.requirements.map(normalizeText).filter(Boolean).slice(0, 30)
    : []
  const keywords = Array.isArray(jobData?.keywords)
    ? jobData.keywords.map(normalizeText).filter(Boolean).slice(0, 30)
    : []
  const postedAt = jobData?.postedAt && !Number.isNaN(new Date(jobData.postedAt).getTime())
    ? new Date(jobData.postedAt)
    : new Date()
  const contractType = CONTRACT_TYPES.has(jobData?.contractType)
    ? jobData.contractType
    : normalizeContractType(jobData?.contractType)

  const normalized = {
    ...jobData,
    userId,
    source,
    sourceId: stableSourceId(source, jobData),
    title,
    company,
    location,
    contractType,
    description,
    requirements,
    keywords,
    isRemote: Boolean(jobData?.isRemote),
    postedAt,
    scrapedAt: new Date(),
  }

  const salary = normalizeSalary(jobData?.salary)
  if (salary) normalized.salary = salary
  else delete normalized.salary

  if (jobData?.salaryText) normalized.salaryText = normalizeText(jobData.salaryText).slice(0, 120)
  delete normalized._detailUrl
  delete normalized.city
  if (jobData?.city) normalized.city = normalizeText(jobData.city)
  return normalized
}

async function persistJobs(userId, sourceName, jobs) {
  const stats = {
    found: Array.isArray(jobs) ? jobs.length : 0,
    newOffers: 0,
    duplicatesSkipped: 0,
    invalidOffers: 0,
    persistenceErrors: 0,
    errors: [],
  }
  const uniqueJobs = new Map()

  for (const jobData of Array.isArray(jobs) ? jobs.slice(0, MAX_OFFERS_PER_SOURCE) : []) {
    const normalized = normalizeJobData(userId, sourceName, jobData)
    if (!normalized) {
      stats.invalidOffers++
      continue
    }
    uniqueJobs.set(`${normalized.source}:${normalized.sourceId}`, normalized)
  }

  if (uniqueJobs.size === 0) return stats

  const operations = [...uniqueJobs.values()].map(jobData => ({
    updateOne: {
      filter: { userId, source: jobData.source, sourceId: jobData.sourceId },
      update: { $setOnInsert: jobData },
      upsert: true,
    },
  }))

  try {
    const result = await JobOffer.bulkWrite(operations, { ordered: false, runValidators: true })
    stats.newOffers = result.upsertedCount || 0
    stats.duplicatesSkipped = result.matchedCount || 0
    stats.persistenceErrors = result.writeErrors?.length || 0
    if (stats.persistenceErrors > 0) stats.errors.push(`${stats.persistenceErrors} offres non enregistrées`)
  } catch (error) {
    stats.persistenceErrors = uniqueJobs.size
    stats.errors.push(error.message)
  }

  return stats
}

async function persistNews(userId, news) {
  if (!Array.isArray(news) || news.length === 0) return 0
  const uniqueNews = new Map()
  for (const item of news.slice(0, 100)) {
    const sourceId = normalizeText(item?.sourceId)
    const title = normalizeText(item?.title)
    if (!sourceId || !title) continue
    uniqueNews.set(sourceId, {
      ...item,
      userId,
      source: 'emploi-public',
      sourceId,
      title,
      excerpt: normalizeText(item.excerpt),
      org: normalizeText(item.org),
      sourceUrl: normalizeText(item.sourceUrl),
      imageUrl: normalizeText(item.imageUrl),
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 10) : [],
    })
  }
  if (uniqueNews.size === 0) return 0
  try {
    const result = await PublicNews.bulkWrite([...uniqueNews.values()].map(item => ({
      updateOne: {
        filter: { userId, source: 'emploi-public', sourceId: item.sourceId },
        update: { $setOnInsert: item },
        upsert: true,
      },
    })), { ordered: false })
    return result.upsertedCount || 0
  } catch (error) {
    console.error('Erreur persistance des news publiques:', error.message)
    return 0
  }
}

async function scrapeAndPersistSource(log, sourceName) {
  const startedAt = Date.now()
  const config = log.config || {}
  const rawConfig = config.sourceKeywords
  const perSource = rawConfig && typeof rawConfig.get === 'function'
    ? rawConfig.get(sourceName)
    : rawConfig?.[sourceName]
  const sourceKeywords = normalizeKeywords(perSource?.length ? perSource : (config.keywords || []), 10)
  let jobs = []
  let news = []
  let status = 'partial'
  let errors = []

  // Battement de cœur : prouve que la collecte avance même quand une source
  // met plusieurs dizaines de secondes, et empêche le chien de garde de
  // déclarer la collecte morte.
  const heartbeat = setInterval(() => {
    ScrapingLog.updateOne(
      { _id: log._id, status: 'running' },
      { $set: { lastActivityAt: new Date() } },
    ).catch(() => {})
  }, HEARTBEAT_MS)

  setSourceProgressHook(fraction => { reportIntraSourceProgress(log, sourceName, fraction) })

  try {
    if (PUBLIC_SOURCES.includes(sourceName)) {
      const result = await scrapePublicSector(config.userProfile, [sourceName])
      jobs = (result.jobs || []).filter(job => job.source === sourceName)
      news = result.news || []
      status = jobs.length > 0 ? 'success' : 'failed'
    } else {
      const results = await scrapeAllSources(
        sourceKeywords,
        config.location || 'Maroc',
        [sourceName],
        config.userProfile,
      )
      const result = results[sourceName] || { jobs: [], status: 'failed', error: 'Aucune réponse de la source' }
      jobs = result.jobs || []
      status = result.status || 'partial'
      if (result.error) errors.push(result.error)
    }
  } catch (error) {
    status = 'failed'
    errors.push(error.message)
  } finally {
    clearInterval(heartbeat)
    setSourceProgressHook(null)
  }

  if (jobs.length === 0 && !errors.length) errors.push('Aucune offre trouvée')
  const persistence = await persistJobs(log.userId, sourceName, jobs)
  const newNews = PUBLIC_SOURCES.includes(sourceName) ? await persistNews(log.userId, news) : 0
  errors = [...errors, ...persistence.errors]

  if (persistence.persistenceErrors > 0) {
    status = jobs.length > 0 ? 'partial' : 'failed'
  } else if (jobs.length > 0 && status === 'partial') {
    // Budget de collecte épuisé mais offres trouvées : la source a bien marché.
    status = 'success'
  }

  return {
    source: sourceName,
    status,
    offersFound: jobs.length,
    newOffers: persistence.newOffers,
    duplicatesSkipped: persistence.duplicatesSkipped,
    invalidOffers: persistence.invalidOffers,
    persistenceErrors: persistence.persistenceErrors,
    newNews,
    duration: Date.now() - startedAt,
    errors,
  }
}

// Progression intra-source : la barre avance aussi pendant qu'une longue source
// est en cours de pagination, au lieu de rester figée plusieurs dizaines de
// secondes. Écritures limitées (une par tranche de 1 %) et non bloquantes.
function reportIntraSourceProgress(log, sourceName, fraction) {
  const sources = (log.sources || []).map(s => (s.toObject ? s.toObject() : { ...s }))
  const total = sources.length || 1
  const completed = sources.filter(s => s.status && s.status !== 'running').length
  const ratio = (completed + Math.min(0.98, Math.max(0, fraction))) / total
  const progress = Math.min(99, Math.round(ratio * 100))
  if (Number(log.progress) === progress) return
  log.progress = progress
  ScrapingLog.updateOne(
    { _id: log._id, status: 'running' },
    { $set: { progress, lastActivityAt: new Date() } },
  ).catch(() => {})
  emitToUser(log.userId, 'scraping:progress', { runId: log._id, progress, source: sourceName })
}

// Progression globale, calculée côté serveur : c'est la seule source de vérité
// pour le pourcentage affiché.
function computeProgress(sources, status) {
  if (status && status !== 'running') return 100
  const list = sources || []
  const total = list.length || 1
  const completed = list.filter(s => s?.status && s.status !== 'running').length
  return Math.min(99, Math.round((completed / total) * 100))
}

async function updateLogSource(logId, userId, sourceStat) {
  const log = await ScrapingLog.findOne({ _id: logId, userId })
  if (!log) return null

  const sources = (log.sources || []).map(source => (source.toObject ? source.toObject() : { ...source }))
  const index = sources.findIndex(source => source.source === sourceStat.source)
  if (index >= 0) sources[index] = { ...sources[index], ...sourceStat }
  else sources.push(sourceStat)

  log.sources = sources
  log.totalSources = sources.length
  log.completedSources = sources.filter(source => source.status && source.status !== 'running').length
  log.currentSource = sources.find(source => source.status === 'running')?.source || ''
  log.progress = computeProgress(sources, log.status)
  log.lastActivityAt = new Date()
  await log.save()
  return log
}

function getOverallStatus(sources) {
  const validSources = (sources || []).filter(source => source && source.status)
  if (validSources.length === 0) return 'failed'
  const successful = validSources.filter(source => source.status === 'success')
  if (successful.length === 0) return 'failed'
  if (successful.length === validSources.length) return 'success'
  return 'partial'
}

async function finalizeLog(log) {
  if (!log || log.status !== 'running') return log
  const sourceStats = (log.sources || []).map(source => (source.toObject ? source.toObject() : source))
  log.status = getOverallStatus(sourceStats)
  log.totalOffersFound = sourceStats.reduce((sum, source) => sum + (source.offersFound || 0), 0)
  log.totalNewOffers = sourceStats.reduce((sum, source) => sum + (source.newOffers || 0), 0)
  log.completedSources = sourceStats.length
  log.totalSources = sourceStats.length
  log.currentSource = ''
  log.progress = 100
  log.completedAt = new Date()
  log.processing = false
  log.lastActivityAt = new Date()
  delete log.processingStartedAt
  await log.save()

  // L'événement de fin part AVANT la notification : l'interface doit passer à
  // 100 % et afficher les offres même si la création de la notification échoue.
  emitToUser(log.userId, 'scraping:done', {
    runId: log._id,
    status: log.status,
    progress: 100,
    totalOffersFound: log.totalOffersFound,
    totalNewOffers: log.totalNewOffers,
    sources: sourceStats,
  })

  try {
    await notifyScrapingComplete(log.userId, {
      count: log.totalNewOffers,
      source: sourceStats.map(source => source.source).filter(Boolean).join(', '),
      status: log.status,
      sources: sourceStats,
      jobs: [],
    })
  } catch (error) {
    console.error('Erreur notification de fin de scraping:', error.message)
  }

  return log
}

// Une collecte sans activité depuis RUN_STALL_MS est morte (processus tué,
// invocation Vercel interrompue, source bloquée) : on clôture quand même,
// sinon le pourcentage reste figé indéfiniment.
function isRunStalled(log) {
  if (!log || log.status !== 'running') return false
  const last = log.lastActivityAt || log.processingStartedAt || log.startedAt || log.createdAt
  if (!last) return false
  return Date.now() - new Date(last).getTime() > RUN_STALL_MS
}

async function abandonRun(log, reason) {
  if (!log || log.status !== 'running') return log
  const sources = (log.sources || []).map(source => (source.toObject ? source.toObject() : { ...source }))
  for (const source of sources) {
    if (source.status === 'running') {
      source.status = 'failed'
      source.offersFound = source.offersFound || 0
      source.newOffers = source.newOffers || 0
      source.duplicatesSkipped = source.duplicatesSkipped || 0
      source.invalidOffers = source.invalidOffers || 0
      source.persistenceErrors = 1
      source.errors = [reason]
    }
  }
  log.sources = sources
  log.error = reason
  return finalizeLog(log)
}

async function processNextSource(log) {
  const runningSource = (log.sources || []).find(source => source.status === 'running')
  if (!runningSource) return finalizeLog(log)

  const sourceStat = await scrapeAndPersistSource(log, runningSource.source)
  const updatedLog = await updateLogSource(log._id, log.userId, sourceStat)
  if (!updatedLog) return null

  emitToUser(log.userId, 'scraping:update', {
    runId: log._id,
    progress: updatedLog.progress,
    ...sourceStat,
  })

  if (!updatedLog.sources.some(source => source.status === 'running')) {
    return finalizeLog(updatedLog)
  }
  return updatedLog
}

// Un pas de collecte, protégé par un verrou atomique en base : deux requêtes
// concurrentes ne peuvent pas traiter la même source en double.
async function runStep(logId, userId) {
  const current = await ScrapingLog.findOne({ _id: logId, userId })
  if (!current || current.status !== 'running') return { log: current, done: true }
  if (isRunStalled(current)) return { log: await abandonRun(current, STALL_REASON), done: true }

  const now = new Date()
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS)
  const claimed = await ScrapingLog.findOneAndUpdate(
    {
      _id: logId,
      userId,
      status: 'running',
      $or: [
        { processing: { $ne: true } },
        { processingStartedAt: { $lt: staleBefore } },
        { processingStartedAt: null },
      ],
    },
    { $set: { processing: true, processingStartedAt: now, lastActivityAt: now } },
    { new: true },
  )

  // Un pas est déjà en cours (pilote interne ou autre requête) : on ne fait
  // rien, le statut courant est renvoyé immédiatement.
  if (!claimed) return { log: current, done: false, busy: true }

  try {
    const log = await processNextSource(claimed)
    if (!log) return { log: claimed, done: true }
    return { log, done: log.status !== 'running' }
  } catch (error) {
    console.error('Erreur collecte source:', error)
    const source = (claimed.sources || []).find(item => item.status === 'running')
    if (source) {
      await updateLogSource(claimed._id, userId, {
        source: source.source,
        status: 'failed',
        offersFound: 0,
        newOffers: 0,
        duplicatesSkipped: 0,
        invalidOffers: 0,
        persistenceErrors: 1,
        newNews: 0,
        errors: [error.message],
        duration: 0,
      })
    }
    const latest = await ScrapingLog.findOne({ _id: claimed._id, userId })
    if (latest && latest.status === 'running' && !latest.sources.some(item => item.status === 'running')) {
      return { log: await finalizeLog(latest), done: true }
    }
    return { log: latest, done: false }
  } finally {
    await ScrapingLog.updateOne(
      { _id: logId, userId, status: 'running' },
      { $set: { processing: false }, $unset: { processingStartedAt: 1 } },
    ).catch(() => {})
  }
}

// Pilote interne : enchaîne les sources sans dépendre du navigateur. C'est ce
// qui garantit que la collecte va au bout même si l'utilisateur ferme l'onglet.
// Sur un environnement sans processus persistant (serverless) le polling HTTP
// prend le relais via runStep(), avec le même verrou.
async function driveRun(logId, userId) {
  if (drivenRuns.has(String(logId))) return
  drivenRuns.add(String(logId))
  try {
    let consecutiveBusy = 0
    for (let guard = 0; guard < 100; guard++) {
      const { done, busy } = await withScrapeBudget(runBudgetMs(), () => runStep(logId, userId))
      if (done) break
      if (busy) {
        consecutiveBusy++
        if (consecutiveBusy > 20) break
        await new Promise(resolve => setTimeout(resolve, 1500))
        continue
      }
      consecutiveBusy = 0
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  } catch (error) {
    console.error('Erreur du pilote de collecte:', error)
    const log = await ScrapingLog.findOne({ _id: logId, userId })
    if (log) await abandonRun(log, `Erreur interne du collecteur : ${error.message}`)
  } finally {
    drivenRuns.delete(String(logId))
  }
}

function startDriver(logId, userId) {
  setImmediate(() => {
    driveRun(logId, userId).catch(error => console.error('Erreur traitement scraping:', error.message))
  })
}

// Une collecte « running » orpheline (processus mort, onglet fermé, invocation
// Vercel coupée) bloquerait tous les lancements suivants : on la clôture au
// lieu de laisser l'utilisateur coincé sur « déjà en cours ».
async function findRecoverableRun(userId) {
  const existing = await ScrapingLog.findOne({ userId, status: 'running' })
  if (!existing) return null
  if (isRunStalled(existing)) {
    await abandonRun(existing, STALL_REASON)
    return null
  }
  return existing
}

router.post('/run', protect, async (req, res) => {
  try {
    const existingRunning = await findRecoverableRun(req.user._id)
    if (existingRunning) {
      // On adopte la collecte existante au lieu de la laisser orpheline : le
      // pourcentage reprend immédiatement et la boucle est relancée si besoin.
      startDriver(existingRunning._id, req.user._id)
      return res.status(202).json({
        runId: existingRunning._id,
        accepted: true,
        status: 'running',
        progress: existingRunning.progress || 0,
        alreadyRunning: true,
        message: 'Une collecte est déjà en cours',
      })
    }

    const { keywords, sourceKeywords, location, sources, searchProfileId } = req.body || {}
    const [profile, user, cv, searchProfiles] = await Promise.all([
      UserProfile.findOne({ userId: req.user._id }),
      User.findById(req.user._id),
      CV.findOne({ userId: req.user._id, isActive: true }),
      SearchProfile.find({ userId: req.user._id, isActive: true }).sort({ updatedAt: -1 }),
    ])

    const activeProfile = searchProfileId
      ? searchProfiles.find(item => item._id.toString() === searchProfileId)
      : searchProfiles[0] || null
    const profileSources = activeProfile?.sourcesConfig
      ? Object.entries(activeProfile.sourcesConfig)
        .filter(([, config]) => config?.enabled)
        .map(([source]) => source)
      : []
    const enabledSources = normalizeSources(
      sources,
      profileSources.length > 0 ? profileSources : SITE_SOURCES.filter(source => source !== CONCOURS_SOURCE),
    )

    if (enabledSources.length === 0) {
      return res.status(400).json({ error: 'Aucune source de scraping sélectionnée' })
    }

    const profileKeywords = [
      ...(activeProfile?.keywords || []),
      ...Object.values(activeProfile?.sourcesConfig || {}).flatMap(config => config?.customKeywords || []),
    ]
    const explicitKeywords = normalizeKeywords(keywords)
    const searchKeywords = explicitKeywords.length > 0
      ? explicitKeywords
      : normalizeKeywords([
        ...profileKeywords,
        ...(profile?.searchKeywords || []),
        ...(profile?.domains || []),
        ...(profile?.skills || []),
        'développeur',
        'ingénieur',
        'chef de projet',
      ], 16)
    const searchLocation = normalizeText(
      location || activeProfile?.locations?.[0] || profile?.preferredLocations?.[0] || profile?.location?.city || 'Maroc',
    )
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

    const perSourceKeywords = normalizeSourceKeywords(sourceKeywords, ALLOWED_SOURCES)
    const mergedKeywords = normalizeKeywords([...searchKeywords, ...Object.values(perSourceKeywords).flat()], 16)

    const log = await ScrapingLog.create({
      userId: req.user._id,
      status: 'running',
      startedAt: new Date(),
      config: {
        keywords: mergedKeywords,
        sourceKeywords: perSourceKeywords,
        location: searchLocation,
        userProfile,
      },
      sources: enabledSources.map(source => ({ source, status: 'running' })),
      progress: 0,
      totalSources: enabledSources.length,
      completedSources: 0,
      currentSource: enabledSources[0] || '',
      lastActivityAt: new Date(),
    })

    res.status(202).json({
      runId: log._id,
      accepted: true,
      status: 'running',
      progress: 0,
      totalSources: enabledSources.length,
      alreadyRunning: false,
      message: 'Collecte lancée',
    })

    startDriver(log._id, req.user._id)
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
    let log = runId
      ? await ScrapingLog.findOne({ userId: req.user._id, _id: runId })
      : await ScrapingLog.findOne({ userId: req.user._id, status: 'running' })

    if (runId && !log) {
      return res.status(404).json({ error: 'Collecte introuvable' })
    }
    if (!runId && !log) {
      log = await ScrapingLog.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
    }

    if (log?.status === 'running') {
      // Relance le pilote en tâche de fond SANS l'attendre : cette route est un
      // simple relevé d'état. La collector ici faisait bloquer la réponse
      // pendant toute la durée d'une source, donc le bouton restait figé à 0 %.
      startDriver(log._id, req.user._id)
    }

    res.json({
      isRunning: !!(log && log.status === 'running'),
      progress: log?.progress ?? 0,
      currentSource: log?.currentSource || '',
      log,
    })
  } catch (error) {
    console.error('Erreur statut scraping:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Reprise des collectes « running » à la demande : appelé périodiquement par le
// serveur long-running, et sans effet si le pilote tourne déjà.
export async function resumeRunningScans() {
  try {
    const logs = await ScrapingLog.find({ status: 'running' }).limit(10)
    for (const log of logs) {
      if (drivenRuns.has(log._id.toString())) continue
      if (isRunStalled(log)) {
        await abandonRun(log, STALL_REASON)
        continue
      }
      startDriver(log._id, log.userId)
    }
  } catch (error) {
    console.error('Erreur de reprise des collectes:', error.message)
  }
}

export default router
