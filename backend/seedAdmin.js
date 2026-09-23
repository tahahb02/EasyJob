import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'

dotenv.config()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

async function seedAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI non défini')
      process.exit(1)
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('📦 Connecté à MongoDB Atlas')

    let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })

    if (admin) {
      admin.role = 'admin'
      admin.isEmailVerified = true
      admin.isActive = true
      admin.password = ADMIN_PASSWORD
      admin.onboardingCompleted = true
      admin.loginAttempts = 0
      admin.lockUntil = undefined
      await admin.save()
      console.log(`♻️ Compte administrateur mis à jour : ${ADMIN_EMAIL}`)
    } else {
      admin = await User.create({
        firstName: 'Directeur',
        lastName: 'EasyJob',
        email: ADMIN_EMAIL.toLowerCase(),
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
    console.log(`\n🔑 Identifiants: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
    console.log('   ⚠️  Il est fortement recommandé de changer ce mot de passe.')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur seedAdmin:', error)
    process.exit(1)
  }
}

seedAdmin()