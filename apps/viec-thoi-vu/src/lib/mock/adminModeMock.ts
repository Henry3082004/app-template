import { AppError, type Api } from '../types'
import { resetFirstVisit } from '../adminMode'
import { me, setCurrent, users, wait } from './core'

const ADMIN = '11111111-1111-4111-8111-000000000003'
const DEMO = { employer: '11111111-1111-4111-8111-000000000002', seeker: '11111111-1111-4111-8111-000000000001' } as const
const KEY = 'mock-admin-stash'
const stashed = () => { try { return sessionStorage.getItem(KEY) === '1' } catch { return false } }
const stash = (on: boolean) => { try { if (on) sessionStorage.setItem(KEY, '1'); else sessionStorage.removeItem(KEY) } catch { /* ignore */ } }

export const adminModeMock: Pick<Api, 'adminMode' | 'adminSessionSaved'> = {
  adminSessionSaved() { return stashed() },
  async adminMode(mode) {
    if (!stashed()) { if (!me().is_admin) throw new AppError('FORBIDDEN'); stash(true) }
    if (mode === 'admin') { setCurrent(ADMIN); stash(false); return wait(users[ADMIN].profile) }
    if (mode === 'new') { resetFirstVisit(); setCurrent(null); return wait(null) }
    setCurrent(DEMO[mode])
    return wait(users[DEMO[mode]].profile)
  },
}
