import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOffer', required: true },
  status: {
    type: String,
    enum: [
      'brouillon', 'envoyee', 'consulte', 'valide_entretien',
      'appel_attente', 'entretien_fait', 'accepte_final', 'refusee'
    ],
    default: 'brouillon'
  },
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
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, enum: ['candidat', 'recruteur', 'systeme'], default: 'systeme' },
    note: String,
  }],
}, { timestamps: true })

applicationSchema.index({ userId: 1, jobOfferId: 1 }, { unique: true })
applicationSchema.index({ jobOfferId: 1, status: 1 })

export default mongoose.model('Application', applicationSchema)
