/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env files with proper priority:
  // .env.local (highest priority) > .env.[mode] > .env
  // Read .env.local first to ensure it takes priority
  let apiUrl: string | null = null
  
  // Read .env.local first (highest priority)
  try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envLocalPath)) {
      const envLocalContent = fs.readFileSync(envLocalPath, 'utf-8')
      const localMatch = envLocalContent.match(/^VITE_API_URL\s*=\s*(.+)$/m)
      if (localMatch && localMatch[1]) {
        apiUrl = localMatch[1].trim()
      }
    }
  } catch (e: any) {
    // Silently fail - will fallback to loadEnv
  }
  
  // Fallback to loadEnv if .env.local doesn't have VITE_API_URL
  // Note: loadEnv should automatically load .env.local with highest priority,
  // but we read it manually above to ensure it takes precedence
  if (!apiUrl) {
    const env = loadEnv(mode, process.cwd(), '')
    if (env.VITE_API_URL) {
      apiUrl = env.VITE_API_URL
    } else {
      apiUrl = 'http://localhost:3000'
    }
  }
  
  // Log for debugging (only in dev mode)
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          // Add rewrite to ensure /api prefix is preserved
          rewrite: (path) => path,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', 'e2e', '**/__tests__/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules',
          'dist',
          'e2e',
          'tests',
          '**/*.config.*',
          '**/test/**',
          '**/setup.ts'
        ]
      }
    },
  }
})
