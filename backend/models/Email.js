import mongoose from 'mongoose'

// Boîte mail interne EasyJob : une copie est créée pour chaque participant
// (émetteur -> `sent`, destinataire -> `received`).
const emailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  direction: { type: String, enum: ['sent', 'received'], required: true, index: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  fromName: { type: String, default: '' },
  toName: { type: String, default: '' },
  fromEmail: { type: String, default: '' },
  toEmail: { type: String, default: '' },
  subject: { type: String, default: '' },
  body: { type: String, default: '' },
  companyName: { type: String, default: '' },
  campaignType: { type: String, default: '' },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  jobOfferId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOffer', default: null },
  messageId: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true })

emailSchema.index({ userId: 1, createdAt: -1 })
emailSchema.index({ userId: 1, direction: 1, createdAt: -1 })

export default mongoose.model('Email', emailSchema)