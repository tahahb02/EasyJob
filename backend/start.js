import dotenv from 'dotenv'
dotenv.config({ path: new URL('../.env', import.meta.url) })

import http from 'http'
import app, { connectDB, runMaintenance } from './server.js'
import { setupSocket } from './services/socketManager.js'
import { startNotificationCron } from './services/notificationCron.js'
import { resumeRunningScans } from './routes/scraping.js'

const PORT = process.env.PORT || 5000

async function start() {
  await connectDB()
  runMaintenance()

  const server = http.createServer(app)
  setupSocket(server)

  startNotificationCron()

  // Filet de sécurité : si un pilote de collecte s'est arrêté (crash, redémarrage,
  // onglet fermé au pire moment), la collecte repart sans intervention utilisateur.
  setInterval(() => { resumeRunningScans() }, 5000)

  server.listen(PORT, () => {
    console.log(`🚀 Serveur EasyJob sur port ${PORT}`)
    console.log(`📡 API: http://localhost:${PORT}/api`)
    console.log(`🔗 Frontend: http://localhost:5173`)
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`)
  })
}

start().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
