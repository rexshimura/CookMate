import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {

    proxy: {
      '/api': {
        // Target the dev server directly
        // Format: http://127.0.0.1:5001 (backend dev server port)
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
        // We do NOT rewrite the path because your Express app expects routes to start with /api
      },
    },
  },
  build: {
    outDir: '../backend/dist',
    emptyOutDir: true,
  },
})