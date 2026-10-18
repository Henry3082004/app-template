import { defineConfig, devices } from '@playwright/test'

// Each server is the mock build (in-memory backend, no network) with different feature switches.
// Ports: 4173 = test-payment mode (default mock), 4174 = free mode (what production runs today),
// 4175 = production login dialog before the Zalo Mini App is public, 4176 = after it is public.
const servers = [
  { port: 4173, env: {} },
  { port: 4174, env: { VITE_MOCK_PAYMENT: 'off', VITE_MOCK_BILLING: 'off' } },
  { port: 4175, env: { VITE_FORCE_PROD_AUTH: '1', VITE_MOCK_ZALO_PUBLISHED: 'off' } },
  { port: 4176, env: { VITE_FORCE_PROD_AUTH: '1', VITE_MOCK_ZALO_PUBLISHED: 'on' } },
]

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 90_000,
  expect: { timeout: 6_000 },
  use: { baseURL: 'http://localhost:4173', locale: 'vi-VN', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'tablet', use: { viewport: { width: 834, height: 1112 }, hasTouch: true } },
  ],
  webServer: servers.map(({ port, env }) => ({
    command: `npx vite build --mode mock --outDir .e2e/${port} --emptyOutDir --logLevel error && npx vite preview --outDir .e2e/${port} --port ${port} --strictPort`,
    port,
    env,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  })),
})
