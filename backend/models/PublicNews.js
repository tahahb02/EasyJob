import mongoose from 'mongoose'

const publicNewsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['emploi-public'], default: 'emploi-public' },
  category: { type: String, enum: ['actualite', 'concours-prochain', 'info'], required: true },
  title: { type: String, required: true },
  excerpt: { type: String, default: '' },
  org: { type: String, default: '' },
  sourceUrl: { type: String, default: '' },
  sourceId: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  postedAt: { type: Date, default: Date.now },
  eventDate: Date,
  tags: [String],
  read: { type: Boolean, default: false },
}, { timestamps: true })

publicNewsSchema.index({ userId: 1, source: 1, sourceId: 1 }, { unique: true, partialFilterExpression: { sourceId: { $type: 'string' } } })
publicNewsSchema.index({ userId: 1, category: 1, postedAt: -1 })

export default mongoose.model('PublicNews', publicNewsSchema)