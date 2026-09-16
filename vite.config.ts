import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The master template is imported with ?url so it is served from disk in dev
  // and emitted as a single hashed asset at build. Never copy it into the repo:
  // template/ belongs to the compiler session and must stay the one source.
  assetsInclude: ['**/*.pptx'],
  server: {
    port: 5173,
    watch: {
      // build/ fills with PowerPoint's own lock files (msoXXXX.tmp) whenever a
      // rendered deck is open, and watching one of those kills the dev server
      // with EBUSY. None of these directories feed the app.
      ignored: ['**/build/**', '**/proposal/**', '**/tools/**', '**/.git/**'],
    },
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
})
