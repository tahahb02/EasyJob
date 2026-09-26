import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import jobRoutes from './routes/jobs.js'
import applicationRoutes from './routes/applications.js'
import recruiterRoutes from './routes/recruiters.js'
import dashboardRoutes from './routes/dashboard.js'
import notificationRoutes from './routes/notifications.js'
import scrapingRoutes from './routes/scraping.js'
import emailTemplateRoutes from './routes/emailTemplates.js'
import searchProfileRoutes from './routes/searchProfiles.js'
import analyticsRoutes from './routes/analytics.js'
import cvRoutes from './routes/cv.js'
import portfolioRoutes from './routes/portfolio.js'
import recruiterSpaceRoutes from './routes/recruiterSpace.js'
import companyEmailRoutes from './routes/companyEmails.js'
import mailRoutes from './routes/mail.js' 
import seedRoutes from './routes/seed.js'
import adminRoutes from './routes/admin.js'

mongoose.set('toJSON', { virtuals: true, versionKey: false })
mongoose.set('toObject', { virtuals: true, versionKey: false })

const app = express()

// Derrière Vercel (ou tout reverse proxy), `req.ip` vaut l'adresse du proxy :
// sans cette option, TOUS les utilisateurs partagent le même compteur et le
// premier qui dépasse bloque tout le monde. On fait confiance au premier saut.
app.set('trust proxy', 1)

app.use(helmet({ contentSecurityPolicy: false }))
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── LIMITATION DE DÉBIT ───────────────────────────────────────────
// Un seul compteur global de 200 requêtes / 15 min était incohérent avec
// l'interface : le suivi du scrapping interroge /scraping/status toutes les
// 1,5 s, soit 600 requêtes sur la fenêtre, et le moindre rechargement de page
// consommait déjà une trentaine d'appels. Résultat : « Trop de requêtes »
// au bout de quelques minutes d'utilisation.
// On sépare donc les budgets : le suivi du scrapping (route très sollicitée
// par nature) a son propre compteur, large, et le reste de l'API garde un
// plafond de protection classique.
const WINDOW_MS = 15 * 60 * 1000

const sharedLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Trop de requêtes',
    message: 'Trop de requêtes, merci de patienter quelques secondes.',
  })
}

// Le suivi du scrapping a son propre compteur et est donc exempté du compteur
// général, sans quoi il consommerait deux quotas et les enêtes RateLimit se
// chevaucheraient.
const isScrapingStatus = req => req.originalUrl.startsWith('/api/scraping/status')

const apiLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isScrapingStatus,
  handler: sharedLimitHandler,
})

// Budget dédié au relevé d'état du scrapping : c'est la seule route legitimately
// appelée en haute fréquence (le suivi de progression).
const scrapingStatusLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 3000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: sharedLimitHandler,
})

app.use('/api/scraping/status', scrapingStatusLimiter)
app.use('/api/', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/profile/cv', cvRoutes)
app.use('/api/profile/portfolio', portfolioRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/recruiters', recruiterRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/scraping', scrapingRoutes)
app.use('/api/emails', emailTemplateRoutes)
app.use('/api/search-profiles', searchProfileRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/recruiter-space', recruiterSpaceRoutes)
app.use('/api/company-emails', companyEmailRoutes)
app.use('/api/mail', mailRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Route non trouvée: ${req.method} ${req.originalUrl}` })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur interne' })
})

async function connectDB() {
  if (mongoose.connection.readyState === 1) return

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGODB_URI non défini')
    throw new Error('MONGODB_URI non défini')
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 25000,
      socketTimeoutMS: 60000,
      bufferCommands: false,
      autoIndex: false,
      maxPoolSize: 5,
      minPoolSize: 0,
    })
    console.log('✅ MongoDB connecté')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    throw err
  }
}

// Tâches post-connection (indexes, compte admin). Non bloquant : appelé en
// arrière-plan sur le chemin de requête ou au démarrage, pour ne jamais
// retarder une réponse.
async function runMaintenance() {
  try {
    const { fixJobOfferIndexes } = await import('./services/dbMigration.js')
    await fixJobOfferIndexes()
    const models = Object.values(mongoose.models)
    await Promise.all(
      models.map((model) => model.createIndexes().catch(() => {}))
    )
  } catch (err) {
    console.error('⚠️ Maintenance index MongoDB:', err.message)
  }
  await ensureAdminAccount()
}

async function ensureAdminAccount() {
  try {
    const User = (await import('./models/User.js')).default
    const email = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase()
    const existing = await User.findOne({ email })

    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin'
        await existing.save()
        console.log('🔐 Compte existant promu en administrateur:', email)
      }
      return
    }

    await User.create({
      firstName: process.env.ADMIN_FIRST_NAME || 'Directeur',
      lastName: process.env.ADMIN_LAST_NAME || 'EasyJob',
      email,
      password: process.env.ADMIN_PASSWORD || 'admin123',
      phone: '',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
      onboardingCompleted: true,
    })
    console.log('🔐 Compte administrateur créé automatiquement:', email)
  } catch (err) {
    console.error('❌ Échec création compte admin:', err.message)
  }
}

export { connectDB, runMaintenance }
export default app
