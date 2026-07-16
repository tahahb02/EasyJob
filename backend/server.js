import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
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

dotenv.config({ path: new URL('../.env', import.meta.url) })

mongoose.set('toJSON', { virtuals: true, versionKey: false })
mongoose.set('toObject', { virtuals: true, versionKey: false })

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Trop de requêtes' } })
app.use('/api/', limiter)

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

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Route non trouvée: ${req.method} ${req.originalUrl}` })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur interne' })
})

async function startServer() {
  let mongoUri = process.env.MONGODB_URI

  try {
    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB connecté (Atlas)')
  } catch (err) {
    console.log('⚠️  MongoDB Atlas non disponible, démarrage avec MongoDB en mémoire...')
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server')
      const mongod = await MongoMemoryServer.create()
      mongoUri = mongod.getUri()
      await mongoose.connect(mongoUri)
      console.log('✅ MongoDB en mémoire démarré')
    } catch (memErr) {
      console.error('❌ Impossible de démarrer MongoDB:', memErr.message)
      process.exit(1)
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Serveur EasyJob sur port ${PORT}`)
    console.log(`📡 API: http://localhost:${PORT}/api`)
    console.log(`🔗 Frontend: http://localhost:5173`)
  })
}

startServer().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})

export default app
