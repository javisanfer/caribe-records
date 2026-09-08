import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cwd } from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')

  if (mode === 'test' && !env.VITE_API_PROXY) {
    throw new Error('VITE_API_PROXY is required in test mode')
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': env.VITE_API_PROXY || 'http://localhost:3000',
      },
    },
  }
})
