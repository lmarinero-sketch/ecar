import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logoECAR.png'],
      manifest: {
        name: 'ECAR ERP Sistema',
        short_name: 'ECAR',
        description: 'ERP para construcción y gestión integral',
        theme_color: '#0B2240',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [
          {
            src: '/logoECAR.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logoECAR.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024 // 20MB limit
      }
    })
  ],
  build: {
    rollupOptions: {
      external: ['canvg']
    }
  },
  optimizeDeps: {
    exclude: ['canvg']
  }
})

