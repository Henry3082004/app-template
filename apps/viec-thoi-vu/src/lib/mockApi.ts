import type { Api } from './types'
import { adminMock } from './mock/adminMock'
import { authMock } from './mock/authMock'
import { capyMock } from './mock/capyMock'
import { collabMock } from './mock/collabMock'
import { jobsMock } from './mock/jobsMock'
import { seedDemoShop } from './mock/demoShop'
import { payMock } from './mock/payMock'

/** In-memory backend for local UI testing (VITE_MOCK=1), split like ./supabase. Shared state and helpers live in ./mock/core. */
export const mockApi: Api = { ...authMock, ...capyMock, ...jobsMock, ...collabMock, ...payMock, ...adminMock }

if (import.meta.env.VITE_DEMO_SHOP === '1') seedDemoShop()
