/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite-Konfiguration: React, PWA (installierbar + App-Shell offline) und Vitest
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // neue Version wird beim nächsten Start automatisch aktiv
      includeAssets: ['icons/apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'Outfit',
        short_name: 'Outfit',
        description: 'Persönlicher Kleiderschrank mit Outfit-Vorschlägen',
        lang: 'de',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fffaf6',
        theme_color: '#fffaf6',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-Shell (HTML, JS, CSS, Schriften, Icons) wird vorab gespeichert → Start auch ohne Netz.
        // Supabase-Anfragen werden bewusst NICHT vom Service Worker gecacht (Daten-Cache übernimmt TanStack Query).
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        // nur lateinische Schriftschnitte (Deutsch), nicht Kyrillisch/Griechisch/Vietnamesisch
        globIgnores: ['**/*cyrillic*', '**/*greek*', '**/*vietnamese*'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Tests in deutscher Zeitzone, damit Datumsgrenzen (23:30 Uhr, Sommerzeit) realistisch geprüft werden
    env: { TZ: 'Europe/Berlin' },
  },
})
