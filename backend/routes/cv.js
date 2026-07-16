import express from 'express'
import mongoose from 'mongoose'
import { protect } from '../middlewares/auth.js'
import { upload } from '../utils/fileUpload.js'

const router = express.Router()

const cvSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  originalName: String,
  fileData: String,
  fileSize: Number,
  mimeType: String,
  extractedText: { type: String, default: '' },
  parsedData: {
    skills: [String],
    experience: [{ title: String, company: String, period: String, description: String }],
    education: [{ degree: String, institution: String, year: String }],
    languages: [String],
    email: String,
    phone: String,
    location: String,
  },
  analysis: {
    score: { type: Number, default: 0 },
    strengths: [String],
    improvements: [String],
    suggestions: [String],
  },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
}, { timestamps: true })

const CV = mongoose.models.CV || mongoose.model('CV', cvSchema)

function analyzeCV(text, parsedData) {
  let score = 0
  const strengths = []
  const improvements = []
  const suggestions = []
  const textLower = text.toLowerCase()

  // === 1. COORDONNÉES (10 pts) ===
  let coordScore = 0
  if (parsedData.email) {
    coordScore += 3
    strengths.push('Email de contact présent — essentiel pour le recruteur')
  } else {
    improvements.push('Email manquant — un recruteur doit pouvoir vous contacter immédiatement')
  }
  if (parsedData.phone) {
    coordScore += 3
    strengths.push('Numéro de téléphone présent')
  } else {
    improvements.push('Téléphone manquant — ajoutez un numéro avec indicatif (+212)')
  }
  if (parsedData.location) {
    coordScore += 2
    strengths.push('Localisation renseignée — aide le recruteur à cerner la mobilité')
  } else {
    improvements.push('Localisation absente — le recruteur doit savoir votre ville')
  }
  const hasLinkedIn = textLower.includes('linkedin.com')
  if (hasLinkedIn) {
    coordScore += 2
    strengths.push('Profil LinkedIn référencé — signe de professionnalisme')
  } else {
    suggestions.push('Ajoutez votre profil LinkedIn — 87% des recruteurs le consultent')
  }
  score += coordScore

  // === 2. COMPÉTENCES TECHNIQUES (20 pts) ===
  if (parsedData.skills.length > 0) {
    const skillScore = Math.min(15, parsedData.skills.length * 2)
    score += skillScore
    strengths.push(`${parsedData.skills.length} compétence(s) technique(s) identifiée(s)`)
    if (parsedData.skills.length >= 5) {
      score += 3
      strengths.push('Bon panel de compétences techniques')
    }
    if (parsedData.skills.length >= 10) {
      score += 2
      strengths.push('Large éventail de compétences — profil polyvalent')
    }
    // Check for trending skills
    const trendingSkills = ['react', 'typescript', 'docker', 'kubernetes', 'aws', 'graphql', 'next.js', 'flutter']
    const foundTrending = parsedData.skills.filter(s => trendingSkills.includes(s.toLowerCase()))
    if (foundTrending.length >= 3) {
      score += 2
      strengths.push(`Compétences tendance détectées : ${foundTrending.slice(0, 3).join(', ')}`)
    }
  } else {
    improvements.push('Aucune compétence technique identifiée — c\'est le point N°1 que les recruteurs scrutent')
    suggestions.push('Créez une section "Compétences" claire avec les technologies maîtrisées')
  }

  // === 3. EXPÉRIENCE PROFESSIONNELLE (25 pts) ===
  if (parsedData.experience.length > 0) {
    const expScore = Math.min(20, parsedData.experience.length * 6)
    score += expScore
    strengths.push(`${parsedData.experience.length} expérience(s) professionnelle(s) documentée(s)`)
    if (parsedData.experience.length >= 3) {
      score += 5
      strengths.push('Parcours professionnel riche et progressif')
    }
    // Check for duration
    const hasPresent = parsedData.experience.some(e => /présent|present|courant|aujourd/i.test(e.period))
    if (hasPresent) {
      score += 2
      strengths.push('Poste actuel identifié — montre la continuité')
    }
  } else {
    improvements.push('Aucune expérience professionnelle détectée — c\'est le critère N°1 en embauche')
    suggestions.push('Même les stages, projets freelance et bénévolat comptent — décrivez-les')
    suggestions.push('Utilisez le format : Poste | Entreprise | Période | Réalisations chiffrées')
  }

  // === 4. FORMATION (10 pts) ===
  if (parsedData.education.length > 0) {
    score += 8
    strengths.push('Parcours académique documenté')
    const hasMaster = textLower.includes('master') || textLower.includes('mba')
    const hasEngineer = textLower.includes('ingénieur') || textLower.includes('engineer')
    if (hasMaster || hasEngineer) {
      score += 2
      strengths.push('Formation supérieure de niveau Master/Ingénieur')
    }
  } else {
    improvements.push('Formation non détectée — ajoutez diplômes et certifications')
    suggestions.push('Placez la section Formation après Expérience (sauf profil junior)')
  }

  // === 5. LANGUES (5 pts) ===
  if (parsedData.languages.length >= 3) {
    score += 5
    strengths.push(`${parsedData.languages.length} langues mentionnées — profil multilingue attractif`)
  } else if (parsedData.languages.length === 2) {
    score += 3
    strengths.push('Bilinguisme mentionné')
  } else if (parsedData.languages.length === 1) {
    score += 1
    suggestions.push('Ajoutez au moins 2 langues — le bilinguisme est un atout majeur au Maroc')
  } else {
    improvements.push('Aucune langue mentionnée — le bilinguisme est indispensable')
    suggestions.push('Minimum : Français + Anglais. L\'Arabe et l\'Espagnol sont des plus')
  }

  // === 6. STRUCTURE & FORME (15 pts) ===
  if (text.length > 2000) {
    score += 8
    strengths.push('CV détaillé et complet (>2000 caractères)')
  } else if (text.length > 1000) {
    score += 5
    strengths.push('CV de longueur correcte')
  } else if (text.length > 500) {
    score += 2
    suggestions.push('CV trop concis — enrichissez avec des réalisations chiffrées')
  } else {
    improvements.push('CV trop court (<500 car.) — les recruteurs en moyenne passent 7 secondes, mais cherchent du contenu')
  }

  // Structure checks
  const hasSummary = textLower.includes('résumé') || textLower.includes('profil') || textLower.includes('summary') || textLower.includes('objectif')
  if (hasSummary) {
    score += 4
    strengths.push('Section profil/résumé présente — accroche le recruteur en 3 secondes')
  } else {
    suggestions.push('Ajoutez un "Profil" en 2-3 lignes : qui vous êtes, votre valeur ajoutée, votre objectif')
  }

  const hasBulletPoints = text.includes('•') || text.includes('-') || text.includes('*') || text.includes('▸') || text.includes('→')
  if (hasBulletPoints) {
    score += 3
    strengths.push('Utilisation de bullet points — lisibilité optimale pour le scanning')
  } else {
    suggestions.push('Utilisez des bullet points (•) pour chaque réalisation — les recruteurs scannent, ne lisent pas')
  }

  // === 7. MOTS-CLÉS TECHNIQUES (5 pts) ===
  const techKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'php', 'angular', 'vue', 'typescript', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'linux', 'api', 'rest', 'graphql', 'flutter', 'swift', 'kotlin']
  const foundKeywords = techKeywords.filter(kw => textLower.includes(kw))
  if (foundKeywords.length >= 5) {
    score += 5
    strengths.push(`${foundKeywords.length} mots-clés techniques détectés — excellent pour le ATS`)
  } else if (foundKeywords.length >= 2) {
    score += 3
    strengths.push(`${foundKeywords.length} mots-clés techniques détectés`)
  } else {
    suggestions.push('Ajoutez plus de mots-clés techniques pertinents pour le filtrage ATS')
  }

  // === 8. RÉALISATIONS & IMPACT (bonus) ===
  const hasNumbers = /\d+%|\d+\s*(ans|ans|mois|k€|MAD|dh)|\d+\s*(projets?|clients?|équipes?)/i.test(text)
  if (hasNumbers) {
    score += 3
    strengths.push('Résultats chiffrés détectés — les recruteurs adorent les métriques')
  } else {
    suggestions.push('Ajoutez des réalisations chiffrées : "Augmenté les ventes de 25%", "Géré une équipe de 8"')
  }

  // === FINAL SCORE ===
  score = Math.min(100, Math.max(0, score))

  // === EXPERT ASSESSMENT ===
  if (score >= 85) {
    strengths.unshift('EXCELLENT CV — Profil hautement qualifié, prêt pour les postes senior')
  } else if (score >= 70) {
    strengths.unshift('TRÈS BON CV — Profil solide avec quelques ajustements possibles')
  } else if (score >= 55) {
    strengths.unshift('BON CV — Base solide, mais des améliorations ciblées le rendront compétitif')
  } else if (score >= 40) {
    strengths.unshift('CV MOYEN — Nécessite des améliorations significatives pour se démarquer')
  } else {
    strengths.unshift('CV À REFAIRE — Reprise complète recommandée pour maximiser vos chances')
  }

  // Always add expert tips
  if (suggestions.length < 4) {
    suggestions.push('Personnalisez votre CV pour chaque offre — les mots-clés de l\'annonce doivent apparaître')
    suggestions.push('Limitez-vous à 1-2 pages maximum, sauf profils très expérimentés')
  }

  return { score, strengths, improvements, suggestions }
}

function parseCVData(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const textLower = text.toLowerCase()

  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/)
  const phoneMatch = text.match(/(\+212|0)[\s.-]?[67]\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/)
  const locationMatch = text.match(/(?:Casablanca|Rabat|Marrakech|Tanger|Fès|Meknès|Agadir|Oujda|Kénitra|Tétouan|Nador|Safi|Mohammedia)/i)

  const skills = []
  const knownSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'PHP', 'C#', '.NET', 'Ruby', 'Go', 'Rust',
    'React', 'Angular', 'Vue.js', 'Vue', 'Node.js', 'Express.js', 'Express', 'Django', 'Flask',
    'Laravel', 'Spring Boot', 'Spring', 'FastAPI', 'Next.js', 'NextJS', 'Nuxt.js',
    'HTML', 'CSS', 'Tailwind CSS', 'Tailwind', 'SASS', 'Bootstrap', 'Material UI',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'GitLab',
    'Linux', 'Nginx', 'Apache', 'Jenkins', 'CI/CD', 'Terraform',
    'REST', 'API', 'GraphQL', 'Microservices',
    'Figma', 'Photoshop', 'Illustrator', 'Adobe XD',
    'Excel', 'Word', 'PowerPoint', 'SAP',
    'Agile', 'Scrum', 'Jira', 'Trello',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
    'Flutter', 'React Native', 'Swift', 'Kotlin', 'Xamarin',
    'Firebase', 'Supabase', 'Stripe',
  ]

  for (const skill of knownSkills) {
    if (textLower.includes(skill.toLowerCase())) {
      skills.push(skill)
    }
  }

  const experience = []
  const expPatterns = [
    /(?: Développeur| Ingénieur| Chef| Manager| Directeur| Responsable| Consultant| Analyste| Designer| Architecte| Lead| Senior| Junior| Stagiaire)[^\n]*/gi,
  ]

  const companyKeywords = ['Maroc', 'Casablanca', 'Rabat', 'Tech', 'Solutions', 'Group', 'Bank', 'Service', 'Digital', 'Consulting']
  const linesArr = text.split('\n')
  for (let i = 0; i < linesArr.length; i++) {
    const line = linesArr[i].trim()
    const yearMatch = line.match(/(\d{4})\s*[-–]\s*(?:\d{4}|Présent|Present|Courant|Aujourd)/i)
    if (yearMatch) {
      const prevLine = i > 0 ? linesArr[i - 1].trim() : ''
      const period = line.match(/\d{4}\s*[-–]\s*(?:\d{4}|Présent|Present|Courant)/i)?.[0] || ''
      const companyLine = companyKeywords.some(kw => prevLine.toLowerCase().includes(kw.toLowerCase())) ? prevLine : line
      experience.push({
        title: prevLine.includes(yearMatch[0]) ? line : prevLine,
        company: companyLine.split('—')[0].split('-')[0].trim(),
        period: period,
        description: '',
      })
    }
  }

  const education = []
  const eduKeywords = ['Université', 'École', 'Institut', 'Faculty', 'Master', 'Licence', 'BTS', 'DUT', 'Doctorat', 'PhD', 'Ingénieur', 'Diplôme', 'Certification']
  for (let i = 0; i < linesArr.length; i++) {
    const line = linesArr[i].trim()
    if (eduKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
      const yearMatch = line.match(/\d{4}\s*[-–]\s*\d{4}/)
      education.push({
        degree: line.split(/\d{4}/)[0].trim(),
        institution: line,
        year: yearMatch?.[0] || '',
      })
    }
  }

  const languages = []
  const langPatterns = ['Français', 'Arabe', 'Anglais', 'Espagnol', 'Allemand', 'Chinois', 'Italien', 'Portugais']
  for (const lang of langPatterns) {
    if (textLower.includes(lang.toLowerCase())) languages.push(lang)
  }

  return {
    skills,
    experience,
    education,
    languages,
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    location: locationMatch?.[0] || '',
  }
}

// GET /api/profile/cv
router.get('/', protect, async (req, res) => {
  try {
    const cv = await CV.findOne({ userId: req.user._id, isActive: true })
    res.json({ cv })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/profile/cv - upload and analyze CV
router.post('/', protect, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' })

    // Deactivate old CVs
    await CV.updateMany({ userId: req.user._id, isActive: true }, { isActive: false })

    let extractedText = ''
    if (req.file.mimetype === 'application/pdf') {
      try {
        const { PDFParse } = await import('pdf-parse')
        const pdfParser = new PDFParse({ data: new Uint8Array(req.file.buffer) })
        const textResult = await pdfParser.getText()
        extractedText = (textResult.text || '').trim()
        await pdfParser.destroy()
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr.message)
      }
    }

    const parsedData = parseCVData(extractedText)
    const analysis = analyzeCV(extractedText, parsedData)

    const cv = await CV.create({
      userId: req.user._id,
      fileName: `cv_${Date.now()}`,
      originalName: req.file.originalname,
      fileData: req.file.buffer.toString('base64'),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      parsedData,
      analysis,
      version: 1,
    })

    res.json({
      cv,
      message: 'CV uploadé et analysé avec succès',
      analysis,
      parsedData,
      extractedText,
    })
  } catch (error) {
    console.error('Erreur upload CV:', error)
    res.status(500).json({ error: 'Erreur lors de l\'upload' })
  }
})

// POST /api/profile/cv/analyze-text - analyze without file upload
router.post('/analyze-text', protect, async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Aucun texte fourni' })

    const parsedData = parseCVData(text)
    const analysis = analyzeCV(text, parsedData)

    res.json({ analysis, parsedData })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'analyse' })
  }
})

// POST /api/profile/cv/match-jobs - match CV against job offers
router.post('/match-jobs', protect, async (req, res) => {
  try {
    const { keywords } = req.body || {}
    const cv = await CV.findOne({ userId: req.user._id, isActive: true })
    if (!cv) return res.status(404).json({ error: 'Aucun CV trouvé' })

    const JobOffer = mongoose.model('JobOffer')
    const query = { userId: req.user._id, isActive: true }

    const allJobs = await JobOffer.find(query)

    const cvSkills = (cv.parsedData?.skills || []).map(s => s.toLowerCase())
    const cvText = (cv.extractedText || '').toLowerCase()
    const searchKeywords = (keywords || []).map(k => k.toLowerCase())

    const matchedJobs = allJobs.map(job => {
      const jobText = `${job.title} ${job.company} ${job.description} ${(job.keywords || []).join(' ')}`.toLowerCase()
      let matchScore = 0
      let matchReasons = []

      // Skill matching
      for (const skill of cvSkills) {
        if (jobText.includes(skill.toLowerCase())) {
          matchScore += 10
          matchReasons.push(`Compétence: ${skill}`)
        }
      }

      // Keyword matching
      for (const kw of searchKeywords) {
        if (jobText.includes(kw)) {
          matchScore += 8
          matchReasons.push(`Mot-clé: ${kw}`)
        }
      }

      // Title relevance
      if (cvText.includes(job.title.toLowerCase().split(' ')[0])) {
        matchScore += 15
        matchReasons.push('Titre pertinent')
      }

      // Experience relevance
      const expYears = cv.parsedData?.experience?.length || 0
      if (expYears > 0 && job.contractType === 'Stage') {
        matchScore -= 5
      }
      if (expYears >= 2 && (job.title.toLowerCase().includes('senior') || job.title.toLowerCase().includes('lead'))) {
        matchScore += 10
        matchReasons.push('Niveau d\'expérience adapté')
      }

      matchScore = Math.min(100, Math.max(0, matchScore + (job.relevanceScore || 0) * 0.3))

      return {
        ...job.toObject(),
        matchScore: Math.round(matchScore),
        matchReasons: matchReasons.slice(0, 5),
      }
    })

    matchedJobs.sort((a, b) => b.matchScore - a.matchScore)

    res.json({
      jobs: matchedJobs.slice(0, 50),
      total: matchedJobs.length,
      cvSkills,
      searchKeywords,
    })
  } catch (error) {
    console.error('Erreur matching:', error)
    res.status(500).json({ error: 'Erreur lors du matching' })
  }
})

// DELETE /api/profile/cv/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await CV.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    res.json({ message: 'CV supprimé' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// PUT /api/profile/cv/:id — update parsed data or re-analyze
router.put('/:id', protect, async (req, res) => {
  try {
    const cv = await CV.findOne({ _id: req.params.id, userId: req.user._id })
    if (!cv) return res.status(404).json({ error: 'CV non trouvé' })

    if (req.body.reanalyze) {
      if (!cv.fileData) return res.status(400).json({ error: 'Aucune donnée de CV stockée' })

      let extractedText = ''
      try {
        const rawBase64 = cv.fileData.startsWith('data:')
          ? cv.fileData.split(',')[1]
          : cv.fileData
        const buffer = Buffer.from(rawBase64, 'base64')
        const { PDFParse } = await import('pdf-parse')
        const pdfParser = new PDFParse({ data: new Uint8Array(buffer) })
        const textResult = await pdfParser.getText()
        extractedText = (textResult.text || '').trim()
        await pdfParser.destroy()
      } catch (pdfErr) {
        console.error('PDF re-parse error:', pdfErr.message)
      }

      if (!extractedText) {
        return res.status(400).json({ error: 'Impossible d\'extraire le texte du CV. Le fichier pourrait être scanné ou protégé.' })
      }

      const parsedData = parseCVData(extractedText)
      const analysis = analyzeCV(extractedText, parsedData)

      cv.extractedText = extractedText
      cv.parsedData = parsedData
      cv.analysis = analysis
      cv.version = (cv.version || 1) + 1
      await cv.save()

      return res.json({ cv, message: 'CV analysé avec succès', analysis, parsedData, extractedText })
    }

    const { parsedData } = req.body
    if (parsedData) {
      cv.parsedData = { ...cv.parsedData, ...parsedData }
      cv.version = (cv.version || 1) + 1
    }
    await cv.save()

    res.json({ cv, message: 'CV mis à jour' })
  } catch (error) {
    console.error('Erreur update CV:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router
