import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import JobOffer from './models/JobOffer.js'
import Application from './models/Application.js'
import EmailTemplate from './models/EmailTemplate.js'
import Notification from './models/Notification.js'
import Recruiter from './models/Recruiter.js'

dotenv.config()

const testEmail = 'test@example.com'

const jobOffers = [
  { title: 'Développeur Full Stack Senior', company: 'TechMaroc Solutions', location: 'Casablanca', isRemote: true, contractType: 'CDI', source: 'linkedin', sector: 'Tech', sourceUrl: 'https://www.linkedin.com/jobs/view/developpeur-full-stack-senior-at-techmaroc-4450001001', description: 'Rejoignez notre équipe pour développer des applications web modernes avec React, Node.js et PostgreSQL.', requirements: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'], relevanceScore: 92, salary: { min: 15000, max: 25000, currency: 'MAD' } },
  { title: 'Ingénieur DevOps', company: 'CloudAfrica', location: 'Rabat', isRemote: false, contractType: 'CDI', source: 'linkedin', sector: 'Tech', sourceUrl: 'https://www.linkedin.com/jobs/view/ingenieur-devops-at-cloudafrica-4450001002', description: 'Mettez en place et administrez nos infrastructures cloud sur AWS.', requirements: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], relevanceScore: 85, salary: { min: 18000, max: 28000, currency: 'MAD' } },
  { title: 'Data Analyst', company: 'DataVision', location: 'Casablanca', isRemote: true, contractType: 'CDI', source: 'linkedin', sector: 'Data', sourceUrl: 'https://www.linkedin.com/jobs/view/data-analyst-at-datavision-4450001003', description: 'Analysez et visualisez les données business pour guider les décisions stratégiques.', requirements: ['Python', 'SQL', 'Power BI', 'Excel'], relevanceScore: 78, salary: { min: 12000, max: 20000, currency: 'MAD' } },
  { title: 'Chef de Projet Digital', company: 'DigitalCraft', location: 'Marrakech', isRemote: false, contractType: 'CDI', source: 'linkedin', sector: 'Digital', sourceUrl: 'https://www.linkedin.com/jobs/view/chef-de-projet-digital-at-digitalcraft-4450001004', description: 'Pilotez des projets web et mobile de A à Z.', requirements: ['Gestion de projet', 'Agile', 'Scrum', 'JIRA'], relevanceScore: 72, salary: { min: 14000, max: 22000, currency: 'MAD' } },
  { title: 'Stage Développeur Frontend', company: 'StartupXYZ', location: 'Casablanca', isRemote: true, contractType: 'Stage', source: 'linkedin', sector: 'Tech', sourceUrl: 'https://www.linkedin.com/jobs/view/stage-developpeur-frontend-at-startupxyz-4450001005', description: 'Stage de 6 mois en développement React/Vue.js.', requirements: ['HTML', 'CSS', 'JavaScript', 'React ou Vue.js'], relevanceScore: 65, salary: { min: 3000, max: 5000, currency: 'MAD' } },
  { title: 'Développeur Mobile Flutter', company: 'AppWorks', location: 'Tanger', isRemote: true, contractType: 'CDD', source: 'linkedin', sector: 'Tech', sourceUrl: 'https://www.linkedin.com/jobs/view/developpeur-mobile-flutter-at-appworks-4450001006', description: 'Développez des applications mobiles multiplateformes avec Flutter.', requirements: ['Flutter', 'Dart', 'Firebase'], relevanceScore: 88, salary: { min: 12000, max: 18000, currency: 'MAD' } },
  { title: 'Consultant SAP', company: 'ERP Maroc', location: 'Casablanca', isRemote: false, contractType: 'Freelance', source: 'linkedin', sector: 'ERP', sourceUrl: 'https://www.linkedin.com/jobs/view/consultant-sap-at-erp-maroc-4450001007', description: 'Conseillez nos clients sur l\'implémentation SAP.', requirements: ['SAP', 'ERP', 'ABAP'], relevanceScore: 45, salary: { min: 25000, max: 40000, currency: 'MAD' } },
  { title: 'Designer UX/UI', company: 'CreativeStudio', location: 'Casablanca', isRemote: true, contractType: 'CDI', source: 'linkedin', sector: 'Design', sourceUrl: 'https://www.linkedin.com/jobs/view/designer-ux-ui-at-creativestudio-4450001008', description: 'Concevez des interfaces utilisateur intuitives et esthétiques.', requirements: ['Figma', 'Adobe XD', 'Prototyping'], relevanceScore: 70, salary: { min: 10000, max: 16000, currency: 'MAD' } },
  { title: 'Responsable Sécurité Informatique', company: 'SecuNet', location: 'Rabat', isRemote: false, contractType: 'CDI', source: 'linkedin', sector: 'Cybersécurité', sourceUrl: 'https://www.linkedin.com/jobs/view/responsable-securite-informatique-at-secunet-4450001009', description: 'Protégez nos systèmes d\'information contre les menaces.', requirements: ['CISSP', 'Firewalls', 'SIEM'], relevanceScore: 35, salary: { min: 20000, max: 35000, currency: 'MAD' } },
  { title: 'Développeur Python/Django', company: 'WebAgency', location: 'Fès', isRemote: true, contractType: 'CDI', source: 'linkedin', sector: 'Tech', sourceUrl: 'https://www.linkedin.com/jobs/view/developpeur-python-django-at-webagency-4450001010', description: 'Développez des applications web robustes avec Django.', requirements: ['Python', 'Django', 'REST API', 'PostgreSQL'], relevanceScore: 82, salary: { min: 11000, max: 19000, currency: 'MAD' } },
]

const applicationStatuses = ['envoyee', 'ouverte', 'en_cours', 'acceptee', 'refusee', 'brouillon']

const defaultTemplates = [
  {
    name: 'Candidature Standard',
    subject: 'Candidature au poste de {{jobTitle}} chez {{company}}',
    body: `<p>Madame, Monsieur,</p><p>Je me permets de vous adresser ma candidature pour le poste de <strong>{{jobTitle}}</strong> au sein de <strong>{{company}}</strong>.</p><p>{{userSummary}}</p><p>Intégrer {{company}} représente pour moi une excellente opportunité.</p><p>Cordialement,<br>{{userName}}</p>`,
    variables: ['jobTitle', 'company', 'userSummary', 'userName'],
    isDefault: true,
    category: 'candidature',
  },
  {
    name: 'Relance après candidature',
    subject: 'Relance — Candidature {{jobTitle}}',
    body: `<p>Madame, Monsieur,</p><p>Je me permets de revenir vers vous concernant ma candidature pour le poste de <strong>{{jobTitle}}</strong>.</p><p>Cordialement,<br>{{userName}}</p>`,
    variables: ['jobTitle', 'userName'],
    isDefault: true,
    category: 'relance',
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('📦 Connecté à MongoDB Atlas')

    const user = await User.findOne({ email: testEmail })
    if (!user) {
      console.log('❌ Utilisateur test non trouvé. Connecte-toi d\'abord pour le créer.')
      process.exit(1)
    }
    const userId = user._id
    console.log(`👤 Utilisateur trouvé: ${userId}`)

    for (const template of defaultTemplates) {
      await EmailTemplate.findOneAndUpdate(
        { name: template.name, isDefault: true },
        template,
        { upsert: true, new: true }
      )
    }
    console.log('✅ Templates d\'emails créés')

    await JobOffer.deleteMany({ userId })
    await Application.deleteMany({ userId })
    await Recruiter.deleteMany({ userId })
    await Notification.deleteMany({ userId })
    console.log('🗑️ Anciennes données nettoyées')

    const createdJobs = []
    for (let i = 0; i < jobOffers.length; i++) {
      const job = jobOffers[i]
      const created = await JobOffer.create({
        ...job,
        userId,
        sourceId: `seed-${Date.now()}-${i}`,
        postedAt: new Date(),
        scrapedAt: new Date(),
      })
      createdJobs.push(created)
    }
    console.log(`✅ ${createdJobs.length} offres d'emploi créées`)

    const statuses = ['envoyee', 'ouverte', 'en_cours', 'acceptee', 'refusee']
    for (let i = 0; i < Math.min(6, createdJobs.length); i++) {
      const status = statuses[i % statuses.length]
      await Application.findOneAndUpdate(
        { userId, jobOfferId: createdJobs[i]._id },
        {
          userId,
          jobOfferId: createdJobs[i]._id,
          status,
          email: { to: `recruteur@${createdJobs[i].company.toLowerCase().replace(/\s+/g, '')}.com`, subject: `Candidature ${createdJobs[i].title}`, body: 'Candidature en ligne', sentAt: status !== 'brouillon' ? new Date() : undefined },
          coverLetter: `Je suis très intéressé par le poste de ${createdJobs[i].title} chez ${createdJobs[i].company}.`,
        },
        { upsert: true, new: true }
      )
    }
    console.log(`✅ ${Math.min(6, createdJobs.length)} candidatures créées`)

    const recruiters = [
      { firstName: 'Fatima', lastName: 'Benali', title: 'HR Manager', company: 'TechMaroc Solutions', email: 'f.benali@techmaroc.ma', location: 'Casablanca', sector: 'Tech', connectionDegree: '1st', linkedinUrl: 'https://www.linkedin.com/in/fatima-benali-hr/', tags: ['tech', 'recrutement'] },
      { firstName: 'Mohammed', lastName: 'Alami', title: 'CTO', company: 'CloudAfrica', email: 'm.alami@cloudafrica.com', location: 'Rabat', sector: 'Tech', connectionDegree: '2nd', linkedinUrl: 'https://www.linkedin.com/in/mohammed-alami-cto/', tags: ['devops', 'cloud'] },
      { firstName: 'Sophia', lastName: 'Tazi', title: 'Talent Acquisition', company: 'DigitalCraft', email: 's.tazi@digitalcraft.ma', location: 'Marrakech', sector: 'Digital', connectionDegree: '1st', linkedinUrl: 'https://www.linkedin.com/in/sophia-tazi-talent/', tags: ['digital', 'recrutement'] },
    ]

    for (const rec of recruiters) {
      await Recruiter.findOneAndUpdate(
        { userId, email: rec.email },
        { ...rec, userId, isActive: true },
        { upsert: true, new: true }
      )
    }
    console.log(`✅ ${recruiters.length} recruteurs créés`)

    const notifications = [
      { type: 'nouvelle_offre', title: 'Nouvelle offre correspondante', message: 'Un nouveau poste de Développeur Full Stack a été trouvé sur LinkedIn.' },
      { type: 'candidature', title: 'Candidature envoyée', message: 'Votre candidature pour DevOps Engineer a été envoyée avec succès.' },
      { type: 'email', title: 'Email ouvert', message: 'Le recruteur a ouvert votre email de candidature.' },
      { type: 'scrapping', title: 'Scraping terminé', message: '12 nouvelles offres ont été collectées depuis LinkedIn.' },
      { type: 'rappel', title: 'Rappel de suivi', message: 'N\'oubliez pas de relancer le recruteur chez TechMaroc.' },
    ]

    for (const notif of notifications) {
      await Notification.findOneAndUpdate(
        { userId, title: notif.title },
        { ...notif, userId, isRead: false },
        { upsert: true, new: true }
      )
    }
    console.log(`✅ ${notifications.length} notifications créées`)
    console.log('🎉 Seed terminé avec succès!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur seed:', error)
    process.exit(1)
  }
}

seed()
