import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3051,
    proxy: {
      '/api': 'http://localhost:3050'
    }
  }
});
