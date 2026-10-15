import { mockApi } from './mockApi'
import { supabaseApi } from './supabaseApi'
import type { Api } from './types'

export const IS_MOCK = import.meta.env.VITE_MOCK === '1'
export const IS_DEMO = import.meta.env.VITE_DEMO === '1'
export const api: Api = IS_MOCK ? mockApi : supabaseApi
