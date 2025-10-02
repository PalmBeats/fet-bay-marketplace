import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Production config for GitHub Pages
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/fet-bay-marketplace/', // GitHub Pages subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  plugins: [react()],
  define: {
    // Add CSP-friendly configuration
    __DEV__: false,
  },
  server: {
    headers: {
      'Content-Security-Policy': "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
    },
  },
})