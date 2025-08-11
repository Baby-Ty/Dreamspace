import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Use a conditional base so local dev remains at '/', while GitHub Pages serves under '/<repo-name>/'.
// When building in GitHub Actions, set GITHUB_PAGES='true'.
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const repository = process.env.GITHUB_REPOSITORY || '' // e.g., "owner/RepoName"
const repoName = repository.includes('/') ? repository.split('/')[1] : 'Dreamspace'

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? `/${repoName}/` : '/',
})