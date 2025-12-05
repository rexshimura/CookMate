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
    port: 3000,
    host: true,
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
    // SPA fallback configuration for client-side routing
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  },
  // Set base path for production deployment
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
})