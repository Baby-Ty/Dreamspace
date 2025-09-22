import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// GitHub Pages deployment configuration
// Since you have a custom domain (CNAME file), serve from root
const base = '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext',
    // Improve chunking for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          auth: ['@azure/msal-browser', '@azure/msal-react'],
          ui: ['lucide-react']
        }
      }
    },
    // Increase chunk size warning limit since we're using large libraries
    chunkSizeWarningLimit: 1000
  }
})