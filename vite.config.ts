import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone goVerifEye customer / shopper verify site.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
  },
})
