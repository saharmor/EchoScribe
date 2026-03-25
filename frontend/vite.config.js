import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(new URL(import.meta.url).pathname), "./src"),
    },
  },
  server: {
    // Bind dev server to a fixed, env-configurable port (defaults to 8282)
    port: Number(process.env.ECHO_SCRIBE_FRONTEND_PORT || 8282),
    strictPort: true,
    proxy: {
      '/api': {
        // Proxy API calls to the backend port (defaults to 9090)
        target: `http://localhost:${process.env.ECHO_SCRIBE_BACKEND_PORT || 9090}`,
        changeOrigin: true,
      },
    },
  },
})
