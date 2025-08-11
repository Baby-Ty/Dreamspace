import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Use a conditional base so local dev remains at '/', while GitHub Pages serves under '/Dreamspace/'.
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? '/Dreamspace/' : '/',
})