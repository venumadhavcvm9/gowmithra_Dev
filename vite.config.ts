import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    port: 3000,       // ✅ set port here
    strictPort: true, // ❗ ensures it does NOT change automatically
  },
  build: {
    outDir: 'dist', // or 'build' if you prefer
  },
  base: './', // 👈 VERY IMPORTANT for Hostinger
})
