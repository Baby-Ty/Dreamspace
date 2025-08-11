import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Serve from root. This works for custom domains on GitHub Pages.
// If you deploy under a subpath in the future, override with BASE env var.
const base = process.env.BASE || '/'

export default defineConfig({
  plugins: [react()],
  base,
})