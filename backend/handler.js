import dotenv from 'dotenv'
dotenv.config({ path: new URL('../.env', import.meta.url) })

import app, { connectDB, runMaintenance } from './server.js'

// Le module reste en cache entre les invocations d'un même isolate serverless :
// on ne reconnecte MongoDB qu'une seule fois par isolate, jamais deux.
let dbPromise = null
let maintenancePromise = null

function respond500(res) {
  try {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } catch (err) {
    /* réponse déjà finalisée */
  }
}

export default async function handler(req, res) {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().catch((err) => {
        dbPromise = null
        throw err
      })
    }
    await dbPromise
  } catch (err) {
    console.error('❌ Handler DB connect error:', err?.message)
    respond500(res)
    return
  }

  // Indexes et compte admin en arrière-plan : ne bloquent jamais la réponse.
  if (!maintenancePromise) {
    maintenancePromise = runMaintenance()
  }

  try {
    return app(req, res)
  } catch (err) {
    console.error('❌ Handler app error:', err?.message)
    respond500(res)
    return undefined
  }
}