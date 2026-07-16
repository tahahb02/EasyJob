import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOffer', required: true },
  status: { type: String, enum: ['brouillon', 'envoyee', 'ouverte', 'en_cours', 'acceptee', 'refusee', 'retiree'], default: 'brouillon' },
  email: {
    to: String,
    subject: String,
    body: String,
    sentAt: Date,
    openedAt: Date,
  },
  coverLetter: String,
  notes: String,
  followUpDate: Date,
  followUpCount: { type: Number, default: 0 },
}, { timestamps: true })

applicationSchema.index({ userId: 1, jobOfferId: 1 }, { unique: true })

export default mongoose.model('Application', applicationSchema)
