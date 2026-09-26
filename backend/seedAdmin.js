import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

async function seedAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI non défini')
      process.exit(1)
    }

    // Aucun identifiant par défaut : exiger un couple explicite. Le script
    // recréait `admin@gmail.com` / `admin123` et réinitialisait le mot de passe
    // de tout compte portant cet email.
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('❌ ADMIN_EMAIL et ADMIN_PASSWORD sont requis (aucun compte admin créé par défaut)')
      process.exit(1)
    }
    if (ADMIN_PASSWORD.length < 12) {
      console.error('❌ ADMIN_PASSWORD doit faire au moins 12 caractères')
      process.exit(1)
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
      console.error('❌ ADMIN_EMAIL invalide')
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('📦 Connecté à MongoDB Atlas')

    let admin = await User.findOne({ email: ADMIN_EMAIL })

    if (admin) {
      // Ne jamais réécrire le mot de passe d'un compte existant : ce script
      // est idempotent et peut être relancé (dploiement, oubli), or il
      // écrasait à chaque fois le mot de passe choisi par l'administrateur.
      // ADMIN_RESET_PASSWORD=true reste disponible pour une rotation
      // délibérée.
      admin.role = 'admin'
      admin.isEmailVerified = true
      admin.isActive = true
      admin.onboardingCompleted = true
      admin.loginAttempts = 0
      admin.lockUntil = undefined
      if (process.env.ADMIN_RESET_PASSWORD === 'true') {
        admin.password = ADMIN_PASSWORD
        await admin.save()
        console.log(`🔑 Mot de passe réinitialisé pour : ${ADMIN_EMAIL}`)
      } else {
        await admin.save()
        console.log(`♻️  Compte existant converti en administrateur : ${ADMIN_EMAIL}`)
        console.log('   Mot de passe inchangé. Pour le renouveler : ADMIN_RESET_PASSWORD=true')
      }
    } else {
      admin = await User.create({
        firstName: 'Directeur',
        lastName: 'EasyJob',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        phone: '',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
        onboardingCompleted: true,
      })
      console.log(`✅ Compte administrateur créé : ${ADMIN_EMAIL}`)
    }

    console.log('\n🛡️  SÉCURITÉ DU COMPTE ADMIN:')
    console.log('   - Mot de passe haché avec bcrypt (12 rounds)')
    console.log('   - Verrouillage automatique après 5 échecs de connexion (15 min)')
    console.log('   - Toutes les routes /api/admin exigeant le rôle "admin"')
    console.log('   - Rate limiting global sur /api/')
    console.log(`\n🔑 Identifiants: ${ADMIN_EMAIL} / (votre ADMIN_PASSWORD)`)
    console.log('   ⚠️  Changez ce mot de passe depuis l\'application après la première connexion.')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur seedAdmin:', error)
    process.exit(1)
  }
}

seedAdmin()