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

// ─── LIMITES DÉDIÉES AUX ENDPOINTS SENSIBLES ────────────────────────
// Le plafond global de 1000/15 min laisse passer, sur la même fenêtre : 1000
// créations de compte, 1000 demandes de code de vérification ou 1000 envois
// d'email. Ces endpoints ont leur propre compteur, calé sur leur coût réel.
const authLimiter = (limit, windowMs, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Un 429 sur ces routes doit toujours rester lisible par le frontend.
  handler: (req, res) => res.status(429).json({ error: message, retryAfterSeconds: Math.ceil(windowMs / 1000) }),
})

const REGISTER_LIMIT = authLimiter(5, 60 * 60 * 1000, 'Trop de créations de compte. Réessayez plus tard.')
const LOGIN_LIMIT = authLimiter(20, 15 * 60 * 1000, 'Trop de tentatives de connexion. Réessayez dans quelques minutes.')
const EMAIL_ROUTE_LIMIT = authLimiter(5, 60 * 60 * 1000, 'Trop de demandes. Vérifiez votre boîte mail ou réessayez plus tard.')
const WRITE_LIMIT = authLimiter(30, 15 * 60 * 1000, 'Trop de requêtes. Merci de patienter quelques minutes.')

app.use('/api/auth/register', REGISTER_LIMIT)
app.use('/api/auth/login', LOGIN_LIMIT)
app.use('/api/auth/refresh-token', LOGIN_LIMIT)
app.use('/api/auth/verify-email', EMAIL_ROUTE_LIMIT)
app.use('/api/auth/resend-verification', EMAIL_ROUTE_LIMIT)
app.use('/api/auth/forgot-password', EMAIL_ROUTE_LIMIT)
app.use('/api/auth/reset-password', EMAIL_ROUTE_LIMIT)

// Upload de fichiers : quelques envoi par heure suffisent, ces routes sont
// coûteuses (stockage base64 + analyse PDF côté serveur).
const UPLOAD_LIMIT = authLimiter(10, 60 * 60 * 1000, 'Trop d\'envois de fichiers. Réessayez plus tard.')
app.use('/api/profile/cv', UPLOAD_LIMIT)
app.use('/api/profile/avatar', UPLOAD_LIMIT)

// Lancement de scrapping : coûteux (appels réseau externes), réservé aux
// rôles qui en ont besoin et plafonné.
const SCRAPE_LIMIT = authLimiter(5, 60 * 60 * 1000, 'Trop de lancements de recherche. Réessayez dans une heure.')
app.use('/api/recruiters/scrape', SCRAPE_LIMIT)
app.use('/api/scraping', SCRAPE_LIMIT)

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

// Le gestionnaire d'erreurs global renvoyait 500 pour toute erreur de typage
// Mongoose. Un ObjectId mal formé (`/api/jobs/abc`) ou une valeur de type
// incorrect (ex. `languages: "x"` au lieu d'un tableau) sont des erreurs de
// requête, pas des pannes serveur : on les expose en 400 avec un message
// exploitable par le frontend, et on masque les détails techniques.
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Identifiant invalide pour le champ « ${err.path} »`,
      field: err.path,
    })
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map(e => e.message)
    return res.status(400).json({
      error: details.length ? details.join(', ') : 'Données invalides',
      fields: details.length ? Object.keys(err.errors || {}) : undefined,
    })
  }
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ error: 'Fichier ou requête trop volumineux' })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corps de requête JSON invalide' })
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({ error: 'Cette donnée existe déjà' })
  }

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
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''
  const isProduction = process.env.NODE_ENV === 'production'

  // En production on n'invente aucun identifiant par défaut. Sans couple
  // ADMIN_EMAIL + ADMIN_PASSWORD explicite, on n'expose ni ne promeut personne :
  // le comportement précédent créait `admin@gmail.com` / `admin123` et
  // promouvait en administrateur n'importe quel compte portant cet email.
  if (!email || !password) {
    if (isProduction) {
      console.warn('⚠️ ADMIN_EMAIL / ADMIN_PASSWORD non définis : aucun compte administrateur créé (sécurité). Définissez-les dans Vercel pour créer l\'admin.')
      return
    }
    console.warn('⚠️ ADMIN_EMAIL / ADMIN_PASSWORD non définis : aucun compte administrateur créé.')
    return
  }

  if (password.length < 12) {
    console.error('❌ ADMIN_PASSWORD doit faire au moins 12 caractères : aucun compte administrateur créé.')
    return
  }

  try {
    const User = (await import('./models/User.js')).default
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
      password,
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
