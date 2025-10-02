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
  base: '/fet-bay-marketplace/', // GitHub Pages subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
