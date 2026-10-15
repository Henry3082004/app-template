import { useState, type FormEvent } from 'react'
import { api, IS_DEMO } from '../lib/api'
import { CITIES } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { DEMO } from '../lib/seed'
import { useSession } from '../lib/session'
import type { Profile, Role } from '../lib/types'
import { ErrorBox } from './ErrorBox'
import { Sheet } from './Sheet'

/** Sign-up / sign-in sheet, opened only when an action needs an account (apply, post). */
export function AuthSheet() {
  const { authRequest, closeAuth, setProfile } = useSession()
  const { t, locale } = useI18n()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [f, setF] = useState({ full_name: '', phone: '', password: '', business_name: '', address: '', city: 'TP.HCM' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  if (!authRequest) return null
  const role: Role = authRequest.role
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const finish = (p: Profile) => {
    setProfile(p)
    closeAuth()
    authRequest.onDone?.(p)
  }

  const run = async (fn: () => Promise<Profile>) => {
    setBusy(true)
    setError(null)
    try { finish(await fn()) } catch (e) { setError(e) } finally { setBusy(false) }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    tap()
    if (mode === 'login') return run(() => api.signIn(f.phone, f.password))
    return run(() => api.signUp({
      phone: f.phone, password: f.password, full_name: f.full_name, role, locale,
      business_name: role === 'employer' ? f.business_name : undefined,
      address: role === 'employer' ? f.address : undefined,
      city: f.city,
    }))
  }

  const demo = (r: Role) => run(() => api.signIn(DEMO[r === 'seeker' ? 'seeker' : 'employer'].phone, DEMO[r === 'seeker' ? 'seeker' : 'employer'].password))
  const isEmployerSignup = mode === 'signup' && role === 'employer'

  return (
    <Sheet onClose={closeAuth} label={mode === 'signup' ? t('signupTitle') : t('loginTitle')}>
      <h2>{mode === 'signup' ? t('signupTitle') : t('loginTitle')}</h2>
      {mode === 'signup' && <p className="muted small">{role === 'employer' ? t('authEmployerSub') : t('authSeekerSub')}</p>}
      <form className="stack mt-16" onSubmit={submit}>
        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="a-name">{t('yourName')}</label>
            <input id="a-name" className="input" value={f.full_name} onChange={set('full_name')} autoComplete="name" required maxLength={80} />
          </div>
        )}
        {isEmployerSignup && (
          <>
            <div className="field">
              <label htmlFor="a-biz">{t('businessName')}</label>
              <input id="a-biz" className="input" value={f.business_name} onChange={set('business_name')} required maxLength={120} placeholder="VD: Quán Cơm Bà Năm" />
            </div>
            <div className="two">
              <div className="field">
                <label htmlFor="a-addr">{t('address')}</label>
                <input id="a-addr" className="input" value={f.address} onChange={set('address')} required maxLength={200} />
              </div>
              <div className="field">
                <label htmlFor="a-city">{t('city')}</label>
                <select id="a-city" className="select" value={f.city} onChange={set('city')}>
                  {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="a-phone">{t('phone')}</label>
          <input id="a-phone" className="input" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required placeholder="0901 234 567" />
        </div>
        <div className="field">
          <label htmlFor="a-pass">{t('password')}</label>
          <input id="a-pass" className="input" type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : 1} />
          {mode === 'signup' && <span className="hint">{t('passwordHint')}</span>}
        </div>
        {error != null && <ErrorBox error={error} where="AuthSheet" />}
        <button className="btn primary block" disabled={busy} type="submit">
          {busy ? '…' : isEmployerSignup ? t('saveAndPost') : mode === 'login' ? t('login') : role === 'seeker' ? t('applyNow') : t('continue')}
        </button>
        <button type="button" className="btn ghost block" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null) }}>
          {mode === 'signup' ? t('haveAccount') : t('noAccount')}
        </button>
      </form>
      {IS_DEMO && (
        <>
          <div className="divider-text">{t('demoOr')}</div>
          <button className="btn secondary block" disabled={busy} onClick={() => demo(role)}>
            {role === 'seeker' ? t('demoSeeker') : t('demoEmployer')}
          </button>
        </>
      )}
    </Sheet>
  )
}
