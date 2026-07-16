import app, { connectDB } from './server.js'

let isConnected = false

export default async function handler(req, res) {
  if (!isConnected) {
    await connectDB()
    isConnected = true
  }
  return app(req, res)
}
