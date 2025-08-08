import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_ORIGIN || 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: process.env.WS_ORIGIN || 'ws://localhost:8001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
