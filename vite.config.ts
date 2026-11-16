/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite-Konfiguration: React-Plugin + Vitest (Tests laufen in Node, die Domain-Logik braucht keinen Browser)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
