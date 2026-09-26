/**
 * Configure l'expéditeur Brevo sans passer par le menu de l'interface.
 *
 *   npm run email:setup
 *
 * Le script :
 *   1. vérifie que la clé API est présente et valide,
 *   2. liste les expéditeurs déjà enregistrés,
 *   3. crée easyjobmarocsupport@gmail.com s'il n'existe pas,
 *   4. affiche l'état de vérification (Brevo envoie un email de confirmation).
 */
import dotenv from 'dotenv'

dotenv.config({ quiet: true })

const { BRAND } = await import('../utils/sendEmail.js')

const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY
const email = process.env.BREVO_SENDER_EMAIL || BRAND.supportEmail
const name = process.env.BREVO_SENDER_NAME || BRAND.supportName

if (!apiKey) {
  console.error('\n✗ BREVO_API_KEY absente.\n')
  console.error('  Récupère-la ici : https://app.brevo.com/settings/keys/api')
  console.error('  puis ajoute-la dans .env :  BREVO_API_KEY=xkeysib-...\n')
  process.exit(1)
}

const call = async (method, path, body) => {
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: {
      'api-key': apiKey,
      'Accept': 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

console.log('\n=== Expéditeur EasyJob / Brevo ===\n')
console.log(`Expéditeur : ${name} <${email}>`)

let list = await call('GET', '/senders')
if (!list.ok) {
  console.error(`\n✗ Clé API refusée (HTTP ${list.status}) : ${list.data.message || 'clé invalide ou expirée'}`)
  console.error('  Vérifie que la clé est bien collée dans .env, sans espaces.\n')
  process.exit(1)
}
console.log('Clé API : valide\n')

const existing = (list.data.senders || []).find(s => s.email?.toLowerCase() === email.toLowerCase())

if (existing) {
  console.log(`✓ Expéditeur déjà enregistré (id ${existing.id}, actif : ${existing.active})`)
} else {
  console.log('→ Expéditeur absent, création en cours...')
  const created = await call('POST', '/senders', { name, email })
  if (!created.ok) {
    console.error(`\n✗ Création refusée (HTTP ${created.status}) : ${created.data.message || JSON.stringify(created.data)}`)
    console.error('\n  Si le message mentionne un quota d\'expéditeurs, connecte-toi plutôt à')
    console.error('  https://app.brevo.com/senders/list et ajoute-le depuis l\'interface.\n')
    process.exit(1)
  }
  console.log(`✓ Créé (id ${created.data.id})`)
}

console.log('\n=== Étape suivante ===\n')
console.log(`Brevo a envoyé un email de vérification à ${email}.`)
console.log('Ouvre cette boîte et clique sur le lien de confirmation :')
console.log(`  https://app.brevo.com/senders/list\n`)
console.log('Sans cette confirmation, tous les envois échoueront en 403')
console.log('("unauthorized sender").')
console.log('Une fois confirmé, lance :  npm run email:test\n')
