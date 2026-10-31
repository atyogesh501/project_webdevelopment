import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootEnvFile = fileURLToPath(new URL('../.env.development.local', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prefer the monorepo-level env file when it exists (used by the v0 preview), otherwise client/.env
  envDir: existsSync(rootEnvFile) ? '..' : '.',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:5000', changeOrigin: true },
    },
  },
})
