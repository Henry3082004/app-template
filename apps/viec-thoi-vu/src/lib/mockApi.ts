import type { Api } from './types'
import { adminMock } from './mock/adminMock'
import { authMock } from './mock/authMock'
import { collabMock } from './mock/collabMock'
import { jobsMock } from './mock/jobsMock'
import { payMock } from './mock/payMock'

/** In-memory backend for local UI testing (VITE_MOCK=1), split like ./supabase. Shared state and helpers live in ./mock/core. */
export const mockApi: Api = { ...authMock, ...jobsMock, ...collabMock, ...payMock, ...adminMock }
