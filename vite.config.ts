import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const repo = process.env.GITHUB_REPO || 'triaje-ia'
const base = process.env.NODE_ENV === 'production' ? `/${repo}/` : '/'

export default defineConfig({
  base,
  plugins: [vue()],
})
