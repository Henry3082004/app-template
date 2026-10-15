import { useState, type FormEvent } from 'react'
import { api, IS_DEMO } from '../lib/api'
import { capy } from '../lib/capy'
import { CITIES } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { DEMO } from '../lib/seed'
import { useSession } from '../lib/session'
import type { Profile, Role } from '../lib/types'
import { Btn, Dialog, ErrorBox, Fld } from './ui'

/** Sign-up / sign-in, opened only when an action needs an account (apply, post). */
export function AuthDialog() {
  const { authRequest, closeAuth, setProfile } = useSession()
  const { t, locale } = useI18n()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [f, setF] = useState({ full_name: '', phone: '', password: '', business_name: '', address: '', city: 'TP.HCM' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  if (!authRequest) return null
  const role: Role = authRequest.role
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const run = async (fn: () => Promise<Profile>) => {
    setBusy(true)
    setError(null)
    try {
      const p = await fn()
      setProfile(p)
      closeAuth()
      authRequest.onDone?.(p)
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
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

  const d = DEMO[role === 'seeker' ? 'seeker' : 'employer']
  const employerSignup = mode === 'signup' && role === 'employer'
  const title = mode === 'login' ? t('loginTitle') : role === 'employer' ? t('hireHello') : t('loginHello')

  return (
    <Dialog onClose={closeAuth} label={title}>
      <img className="wavecorner" src={capy('wave')} alt="" />
      <h2>{title}</h2>
      {mode === 'signup' && <div className="sub" style={{ marginTop: -8 }}>{role === 'employer' ? t('authEmployerSub') : t('authSeekerSub')}</div>}
      <form className="stack" onSubmit={submit}>
        {mode === 'signup' && (
          <Fld label={t('yourName')} htmlFor="a-name"><input id="a-name" className="inp" value={f.full_name} onChange={set('full_name')} autoComplete="name" required maxLength={80} /></Fld>
        )}
        {employerSignup && (
          <>
            <Fld label={t('businessName')} htmlFor="a-biz"><input id="a-biz" className="inp" value={f.business_name} onChange={set('business_name')} required maxLength={120} placeholder="VD: Quán Cơm Bà Năm" /></Fld>
            <div className="formgrid">
              <Fld label={t('address')} htmlFor="a-addr"><input id="a-addr" className="inp" value={f.address} onChange={set('address')} required maxLength={200} /></Fld>
              <Fld label={t('city')} htmlFor="a-city">
                <select id="a-city" className="inp" value={f.city} onChange={set('city')}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
              </Fld>
            </div>
          </>
        )}
        <Fld label={t('phone')} htmlFor="a-phone"><input id="a-phone" className="inp" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required placeholder="0901 234 567" /></Fld>
        <Fld label={t('password')} htmlFor="a-pass" hint={mode === 'signup' ? t('passwordHint') : undefined}>
          <input id="a-pass" className="inp" type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : 1} />
        </Fld>
        {error != null && <ErrorBox error={error} where="AuthDialog" />}
        <Btn block type="submit" disabled={busy}>
          {busy ? '…' : employerSignup ? t('saveAndPost') : mode === 'login' ? t('login') : role === 'seeker' ? t('applyNow') : t('continue')}
        </Btn>
      </form>
      <Btn v="ghost" block onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null) }}>
        {mode === 'signup' ? t('haveAccount') : t('noAccount')}
      </Btn>
      {IS_DEMO && <Btn v="text" block disabled={busy} onClick={() => run(() => api.signIn(d.phone, d.password))}>{role === 'seeker' ? t('demoSeeker') : t('demoEmployer')}</Btn>}
    </Dialog>
  )
}
