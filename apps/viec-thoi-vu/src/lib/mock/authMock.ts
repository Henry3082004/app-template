import { AppError, type Api, type Profile } from '../types'
import { normalizePhone } from '../phone'
import { CFG, nid, users, addUser, current, quizzes, setCurrent, wait, me, byDigits } from './core'

export const authMock: Pick<Api, 'me' | 'signUp' | 'signIn' | 'signInWithGoogle' | 'pendingProfile' | 'completeProfile' | 'zaloLogin' | 'zaloSignUp' | 'signOut' | 'updateProfile' | 'addRole' | 'switchRole' | 'uploadAvatar' | 'appConfig' | 'saveQuiz' | 'myQuiz'> = {
  async me() { return wait(current && users[current] ? users[current].profile : null) },

  async signUp(input) {
    const d = normalizePhone(input.phone)
    if (!d) throw new AppError('INVALID_PHONE')
    if (input.password.length < 8) throw new AppError('WEAK_PASSWORD')
    if (!input.full_name.trim()) throw new AppError('NAME_REQUIRED')
    if (byDigits(d)) throw new AppError('PHONE_TAKEN')
    const id = nid()
    addUser(id, d, input.password, input.role, input.full_name.trim(), {
      bio: input.bio || null, business_name: input.business_name || null, address: input.address || null, city: input.city || null, locale: input.locale,
    })
    setCurrent(id)
    return wait(users[id].profile)
  },

  async signIn(phone, password) {
    const d = normalizePhone(phone)
    if (!d) throw new AppError('INVALID_PHONE')
    const u = byDigits(d)
    if (!u || u.password !== password) throw new AppError('INVALID_LOGIN')
    setCurrent(u.profile.id)
    return wait(u.profile)
  },

  async signInWithGoogle() {
    let g = { email: 'ann@example.com', name: 'Ann Lee' }
    try { g = JSON.parse(sessionStorage.getItem('mock-google') || 'null') || g } catch { /* ignore */ }
    const existing = Object.values(users).find((u) => (u.profile as Profile & { email?: string }).email === g.email)
    if (existing) setCurrent(existing.profile.id)
    else { try { sessionStorage.setItem('mock-google-pending', JSON.stringify(g)) } catch { /* ignore */ } }
    return wait(undefined)
  },
  async pendingProfile() {
    if (current && users[current]) return wait(null)
    try { const g = JSON.parse(sessionStorage.getItem('mock-google-pending') || 'null'); return wait(g ? { email: g.email, name: g.name } : null) } catch { return wait(null) }
  },
  async completeProfile(i) {
    let g: { email: string } | null = null
    try { g = JSON.parse(sessionStorage.getItem('mock-google-pending') || 'null') } catch { /* ignore */ }
    if (!g) throw new AppError('NOT_SIGNED_IN')
    const raw = i.phone.trim()
    const digits = raw.replace(/\D/g, '')
    const ok = (raw.startsWith('+') || raw.startsWith('0')) && /^[0-9]{8,15}$/.test(raw.startsWith('0') ? '84' + digits.slice(1) : digits)
    if (!ok) throw new AppError('BAD_PHONE')
    if (!i.full_name.trim()) throw new AppError('NAME_REQUIRED')
    const id = nid()
    addUser(id, raw.startsWith('0') ? '84' + digits.slice(1) : digits, 'x-google-only', i.role, i.full_name.trim(), {
      bio: i.role === 'seeker' ? i.bio || null : null, business_name: i.role === 'employer' ? i.business_name || null : null,
      address: i.role === 'employer' ? i.address || null : null, city: i.city || null, locale: i.locale,
    })
    ;(users[id].profile as Profile & { email?: string }).email = g.email
    try { sessionStorage.removeItem('mock-google-pending') } catch { /* ignore */ }
    setCurrent(id)
    return wait(users[id].profile)
  },

  async zaloLogin(creds) {
    // Mock: the "phone token" IS the phone, so tests can choose who is logging in.
    const d = normalizePhone(creds.phone_token)
    if (!d) throw new AppError('ZALO_VERIFY_FAILED')
    const u = byDigits(d)
    if (u) { setCurrent(u.profile.id); return wait({ profile: u.profile }) }
    return wait({ ticket: 'mock-ticket-' + d, phone: d })
  },

  async zaloSignUp(ticket, input) {
    const d = ticket.replace('mock-ticket-', '')
    if (!ticket.startsWith('mock-ticket-') || byDigits(d)) throw new AppError('TICKET_INVALID')
    if (!input.full_name.trim()) throw new AppError('NAME_REQUIRED')
    const id = nid()
    addUser(id, d, 'x-zalo-only', input.role, input.full_name.trim(), {
      bio: input.bio || null, business_name: input.business_name || null, address: input.address || null, city: input.city || null, locale: input.locale,
    })
    setCurrent(id)
    return wait(users[id].profile)
  },

  async signOut() { setCurrent(null) },

  async updateProfile(patch) {
    const p = me()
    if (patch.experience?.includes('none') && patch.experience.length > 1) throw new AppError('UNKNOWN', 'profiles_experience_chk')
    Object.assign(p, patch)
    return wait(p)
  },
  async addRole(role, business) {
    const p = me()
    if (p.roles.includes(role)) throw new AppError('ROLE_EXISTS')
    if (role === 'employer' && ((business?.business_name.trim().length ?? 0) < 2 || (business?.address.trim().length ?? 0) < 3)) throw new AppError('BUSINESS_REQUIRED')
    Object.assign(p, { roles: [...p.roles, role], role }, role === 'employer' ? { business_name: business!.business_name.trim(), address: business!.address.trim(), city: business!.city || p.city } : {})
    return wait(p)
  },
  async switchRole(role) {
    const p = me()
    if (!p.roles.includes(role)) throw new AppError('ROLE_NOT_OWNED')
    p.role = role
    return wait(p)
  },
  async uploadAvatar(photo) {
    me()
    return new Promise<string>((ok, fail) => {
      const r = new FileReader()
      r.onload = () => ok(String(r.result))
      r.onerror = () => fail(new AppError('PHOTO_FAILED'))
      r.readAsDataURL(photo)
    })
  },

  async appConfig() { return wait(CFG) },
  async saveQuiz(device, answers) {
    const key = current ?? device
    quizzes[key] = { ...quizzes[key], ...(current ? quizzes[device] : {}), ...answers }
    return wait(undefined)
  },
  async myQuiz() {
    return wait(current ? { ...quizzes[current] } : {})
  }
}
