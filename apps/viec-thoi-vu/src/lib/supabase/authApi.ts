import { AppError, type Api, type AppConfig, type ProfileUpdate, type SignUpInput } from '../types'
import type { QuizAnswers } from '../quiz'
import { normalizePhone, phoneEmail } from '../phone'
import { sb, fail, rpc, uid, WORKER_KEYS, loadProfile, requireProfile, callFunction, sessionFromHash } from './core'

export const authApi: Pick<Api, 'me' | 'signUp' | 'signIn' | 'signInWithGoogle' | 'pendingProfile' | 'completeProfile' | 'zaloLogin' | 'zaloSignUp' | 'signOut' | 'updateProfile' | 'addRole' | 'switchRole' | 'uploadAvatar' | 'appConfig' | 'saveQuiz' | 'myQuiz'> = {
  async me() {
    const { data } = await sb.auth.getSession()
    if (!data.session) return null
    return loadProfile(data.session.user.id)
  },

  async signUp(input: SignUpInput) {
    const digits = normalizePhone(input.phone)
    if (!digits) throw new AppError('INVALID_PHONE')
    await callFunction('signup', { ...input, phone: digits }, 'SIGNUP_FAILED')
    return this.signIn(digits, input.password)
  },

  async signIn(phone, password) {
    const digits = normalizePhone(phone)
    if (!digits) throw new AppError('INVALID_PHONE')
    const { data, error } = await sb.auth.signInWithPassword({ email: phoneEmail(digits), password })
    if (error || !data.user) {
      if (error && /invalid login/i.test(error.message)) throw new AppError('INVALID_LOGIN')
      fail(error)
    }
    return requireProfile(data.user.id)
  },

  async signInWithGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/app`, queryParams: { prompt: 'select_account' } },
    })
    if (error) fail(error)
  },

  async pendingProfile() {
    const { data } = await sb.auth.getSession()
    const u = data.session?.user
    if (!u) return null
    const p = await loadProfile(u.id)
    if (p) return null
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>
    return { email: u.email ?? null, name: String(meta.full_name ?? meta.name ?? '') || null }
  },

  async completeProfile(i) {
    await rpc('complete_profile', {
      p_role: i.role, p_full_name: i.full_name, p_phone: i.phone, p_bio: i.bio ?? null,
      p_business: i.business_name ?? null, p_address: i.address ?? null, p_city: i.city ?? null, p_locale: i.locale,
    })
    return requireProfile(await uid())
  },

  async zaloLogin(creds) {
    const body = await callFunction('zalo-login', { ...creds }, 'LOGIN_FAILED')
    if (body.needs_signup) return { ticket: String(body.ticket), phone: String(body.phone) }
    return { profile: await sessionFromHash(body) }
  },

  async zaloSignUp(ticket, input) {
    return sessionFromHash(await callFunction('zalo-login', { ...input, ticket }, 'LOGIN_FAILED'))
  },

  async signOut() {
    await sb.auth.signOut()
  },

  async updateProfile(patch: ProfileUpdate) {
    const id = await uid()
    const worker = Object.fromEntries(Object.entries(patch).filter(([k]) => (WORKER_KEYS as readonly string[]).includes(k)))
    const account = Object.fromEntries(Object.entries(patch).filter(([k]) => !(WORKER_KEYS as readonly string[]).includes(k)))
    if (Object.keys(account).length) {
      const { error } = await sb.from('profiles').update(account).eq('id', id)
      if (error) fail(error)
    }
    if (Object.keys(worker).length) {
      const { error } = await sb.from('worker_profiles').upsert({ user_id: id, ...worker }, { onConflict: 'user_id' })
      if (error) fail(error)
    }
    return requireProfile(id)
  },

  async addRole(role, business) {
    await rpc('add_role', { p_role: role, p_business: business?.business_name ?? null, p_address: business?.address ?? null, p_city: business?.city ?? null })
    return requireProfile(await uid())
  },

  async switchRole(role) {
    await rpc('switch_role', { p_role: role })
    return requireProfile(await uid())
  },

  async uploadAvatar(photo) {
    const path = `${await uid()}/${Date.now().toString(36)}.jpg`
    const { error } = await sb.storage.from('avatars').upload(path, photo, { contentType: 'image/jpeg' })
    if (error) throw new AppError(/fetch|network/i.test(error.message) ? 'NETWORK' : 'PHOTO_FAILED', error.message)
    return path
  },

  async appConfig() {
    return (await rpc('app_config')) as AppConfig
  },

  async saveQuiz(device, answers) {
    await rpc('save_quiz', { p_device: device, p_answers: answers })
  },

  async myQuiz() {
    return ((await rpc('my_quiz')) ?? {}) as QuizAnswers
  }
}
