import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/ecobonus.spec.ts',
  reporter: 'list',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5180' },
  webServer: { command: 'npx vite --host 0.0.0.0 --port 5180 --strictPort', cwd: '../templates/react', url: 'http://localhost:5180', reuseExistingServer: true, timeout: 120_000 },
})
