/**
 * Test d'envoi d'email — vérifie l'expéditeur réellement utilisé.
 *
 *   npm run email:test                    → envoie à easyjobmarocsupport@gmail.com
 *   npm run email:test -- mon@email.com   → envoie à l'adresse indiquée
 *
 * Le script affiche l'expéditeur résolu AVANT l'envoi : si ce n'est pas
 * easyjobmarocsupport@gmail.com, c'est que la configuration est incomplète.
 */
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const { resolveSender, BRAND, sendVerificationEmail, sendEmail } = await import('../utils/sendEmail.js')

const target = process.argv[2] || BRAND.supportEmail
const sender = resolveSender()

const ok = (label, good, extra = '') => {
  console.log(`${good ? 'OK  ' : 'ECHEC'}  ${label}${extra ? `  :: ${extra}` : ''}`)
  return good
}

console.log('\n=== Configuration email EasyJob ===\n')
console.log(`Expéditeur résolu   : ${sender.name} <${sender.email}>`)
console.log(`Adresse de support  : ${BRAND.supportEmail}`)
console.log(`Destinataire        : ${target}`)
console.log(`Fournisseur         : ${process.env.EMAIL_PROVIDER || 'auto'}`)
console.log(`Clé Brevo présente  : ${process.env.BREVO_API_KEY ? 'oui' : 'NON'}`)
console.log('')

let valid = true
valid = ok('L\'expéditeur est bien l\'adresse de la plateforme',
  sender.email === BRAND.supportEmail, sender.email) && valid

if (process.env.BREVO_API_KEY) {
  console.log('  → env Brevo détectée')
} else {
  console.log('  → pas de clé Brevo : le fallback SMTP sera utilisé.')
  console.log('    Pour Brevo, ajoutez BREVO_API_KEY dans .env et sur Vercel.')
  console.log('')
}

console.log("\n=== Envoi d'un email de test ===\n")
const result = await sendVerificationEmail(target, 'Test EasyJob', '123456')

if (result.success) {
  console.log(`\nEmail envoyé avec succès (id: ${result.messageId})`)
  if (result.previewUrl) console.log(`Aperçu : ${result.previewUrl}`)
  console.log(`\nVérifie la réception dans ${target} et que l'expéditeur`)
  console.log('affiche bien « EasyJob Support ».')
  process.exit(valid ? 0 : 1)
}

console.log(`\nÉchec de l'envoi : ${result.error}`)
console.log('\nCauses fréquentes :')
console.log('  - expéditeur non vérifié dans Brevo → 403 unauthorized sender')
console.log('  - clé API absente ou expirée')
console.log('  - en local : EMAIL_PASS doit être un mot de passe d\'application Google')
process.exit(1)
