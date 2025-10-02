import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Production config for GitHub Pages
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/', // Try root first, GitHub Pages auto redirects
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
