import { AppError, type Api } from '../types'
import { resetFirstVisit } from '../adminMode'
import { sb, URL, KEY, requireProfile, loadProfile, sessionFromHash } from './core'

/**
 * Admin modes. The admin's own session is kept on this device while looking around as someone else, and put back on the way out.
 * The two "as a shop / as a worker" modes use SAMPLE accounts only: the server (admin-switch) refuses anything else.
 */
const KEY_SAVED = 'vtv-admin-session'
interface Saved { access_token: string; refresh_token: string }
const read = (): Saved | null => { try { return JSON.parse(localStorage.getItem(KEY_SAVED) || 'null') } catch { return null } }
const write = (s: Saved | null) => { try { if (s) localStorage.setItem(KEY_SAVED, JSON.stringify(s)); else localStorage.removeItem(KEY_SAVED) } catch { /* storage unavailable */ } }

/** Get the admin's session (from the saved one when we are looking around as someone else) and keep a fresh copy of it. */
async function adminSession(): Promise<string> {
  const saved = read()
  if (saved) {
    const { data, error } = await sb.auth.setSession(saved)
    if (error || !data.session) { write(null); throw new AppError('ADMIN_SESSION_LOST') }
    write({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
    return data.session.access_token
  }
  const { data } = await sb.auth.getSession()
  const s = data.session
  if (!s) throw new AppError('FORBIDDEN')
  const p = await loadProfile(s.user.id)
  if (!p?.is_admin) throw new AppError('FORBIDDEN')
  write({ access_token: s.access_token, refresh_token: s.refresh_token })
  return s.access_token
}

export const adminModeApi: Pick<Api, 'adminMode' | 'adminSessionSaved'> = {
  adminSessionSaved() { return !!read() },

  async adminMode(mode) {
    if (mode === 'admin') {
      const saved = read()
      if (!saved) throw new AppError('ADMIN_SESSION_LOST')
      const { data, error } = await sb.auth.setSession(saved)
      if (error || !data.user) { write(null); throw new AppError('ADMIN_SESSION_LOST') }
      write(null)
      return requireProfile(data.user.id)
    }
    const token = await adminSession()
    if (mode === 'new') {
      resetFirstVisit()
      await sb.auth.signOut({ scope: 'local' }) // only this device: the saved admin session stays valid
      return null
    }
    let res: Response
    try {
      res = await fetch(`${URL}/functions/v1/admin-switch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${token}` }, body: JSON.stringify({ mode }),
      })
    } catch (e) { throw new AppError('NETWORK', String(e)) }
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new AppError(body.error || 'SWITCH_FAILED')
    return sessionFromHash(body)
  },
}
