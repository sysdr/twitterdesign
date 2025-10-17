import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './src/dashboard',
  build: {
    outDir: '../../dist/dashboard'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
});
