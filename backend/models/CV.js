import mongoose from 'mongoose'

const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  originalName: String,
  fileData: String,
  fileSize: Number,
  mimeType: String,
  extractedText: { type: String, default: '' },
  parsedData: {
    fullName: { type: String, default: '' },
    skills: [String],
    softSkills: [String],
    experience: [{ title: String, company: String, period: String, description: String }],
    education: [{ degree: String, institution: String, year: String }],
    languages: [String],
    certifications: [{ name: String, issuer: String, year: String }],
    projects: [{ name: String, description: String, link: String }],
    email: String,
    phone: String,
    location: String,
    contact: {
      fullName: { type: String, default: '' },
      address: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      website: { type: String, default: '' },
    },
  },
  analysis: {
    score: { type: Number, default: 0 },
    strengths: [String],
    improvements: [String],
    suggestions: [String],
  },
  candidateSummary: { type: String, default: '' },
  keywords: [String],
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
}, { timestamps: true })

export default mongoose.models.CV || mongoose.model('CV', cvSchema)