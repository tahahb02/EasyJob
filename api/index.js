import app, { connectDB } from '../backend/server.js'

let isConnected = false

async function handler(req, res) {
  if (!isConnected) {
    await connectDB()
    isConnected = true
  }
  return app(req, res)
}

export default handler
