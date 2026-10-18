import { mockApi } from './mockApi'
import { supabaseApi } from './supabaseApi'
import type { Api } from './types'

export const IS_MOCK = import.meta.env.VITE_MOCK === '1'
export const IS_DEMO = import.meta.env.VITE_DEMO === '1'
/** Real sign-ups are Zalo (Vietnam) or Google (international). Phone+password exists only in demo/mock builds. */
export const ALLOW_PASSWORD = (IS_MOCK || IS_DEMO) && import.meta.env.VITE_FORCE_PROD_AUTH !== '1'
export const api: Api = IS_MOCK ? mockApi : supabaseApi
