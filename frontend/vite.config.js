import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  base: isGitHubPages ? '/EchoScribe/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(new URL(import.meta.url).pathname), "./src"),
    },
  },
  server: {
    port: Number(process.env.ECHO_SCRIBE_FRONTEND_PORT || 8282),
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.ECHO_SCRIBE_BACKEND_PORT || 9090}`,
        changeOrigin: true,
      },
    },
  },
})
