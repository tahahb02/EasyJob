import mongoose from 'mongoose'

const scrapingLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['running', 'success', 'partial', 'failed'], default: 'running' },
  sources: [{
    source: String,
    status: String,
    offersFound: { type: Number, default: 0 },
    newOffers: { type: Number, default: 0 },
    duplicatesSkipped: { type: Number, default: 0 },
    invalidOffers: { type: Number, default: 0 },
    persistenceErrors: { type: Number, default: 0 },
    errors: [String],
    duration: Number,
  }],
  config: {
    keywords: [String],
    // Mots-clés par source : chaque site est interrogé avec son propre
    // vocabulaire, sinon les mots-clés français sont écartés au profit des
    // premiers mots-clés de la liste globale et la source ne renvoie rien.
    sourceKeywords: { type: Map, of: [String], default: {} },
    location: String,
    userProfile: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  progress: { type: Number, default: 0 },
  totalSources: { type: Number, default: 0 },
  completedSources: { type: Number, default: 0 },
  currentSource: { type: String, default: '' },
  lastActivityAt: { type: Date, default: Date.now },
  error: String,
  processing: { type: Boolean, default: false },
  processingStartedAt: Date,
  totalOffersFound: { type: Number, default: 0 },
  totalNewOffers: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true, suppressReservedKeysWarning: true })

scrapingLogSchema.index({ userId: 1, status: 1 })
scrapingLogSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('ScrapingLog', scrapingLogSchema)
