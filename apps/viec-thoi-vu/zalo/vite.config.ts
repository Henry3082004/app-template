import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import zaloMiniApp from 'zmp-vite-plugin'
import { defineConfig } from 'vite'

// Zalo Mini App build: same React source as the web app (../src), packaged by zmp-cli into ./www.
export default defineConfig({
  root: __dirname,
  base: '',
  envDir: resolve(__dirname, '..'),
  publicDir: resolve(__dirname, '../public'),
  plugins: [zaloMiniApp(), react()],
  define: { 'import.meta.env.VITE_ZALO': '"1"' },
  build: { outDir: 'www', emptyOutDir: true, sourcemap: false },
})
