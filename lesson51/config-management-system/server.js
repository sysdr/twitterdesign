import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.json())

// API routes placeholder - actual logic is in frontend
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const server = createServer(app)

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected')
  })
})

server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`)
})

