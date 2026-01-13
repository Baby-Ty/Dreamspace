import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// GitHub Pages deployment configuration
// Since you have a custom domain (CNAME file), serve from root
const base = '/'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base,
  // Strip console.log/debug in production builds (keep console.error/warn for debugging)
  esbuild: {
    // Mark these as pure (no side effects) so they get removed in production
    pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
    // Also drop debugger statements in production
    drop: mode === 'production' ? ['debugger'] : [],
  },
  server: {
    // Proxy API requests to Azure Functions running locally
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
        secure: false,
      }
    }
  },
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
        },
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Increase chunk size warning limit since we're using large libraries
    chunkSizeWarningLimit: 1000
  }
}))