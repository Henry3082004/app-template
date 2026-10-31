import { useEffect, useState, type FormEvent } from 'react'
import { IN_ZALO } from '../../lib/zalo'
import { getZaloCredentials, type ZaloCredentials } from '../../lib/zaloAuth'
import { ALLOW_PASSWORD, api, IS_DEMO } from '../../lib/api'
import { useAppConfig } from '../../lib/config'
import { capy } from '../../lib/capy'
import { CITIES } from '../../lib/geo'
import { tap } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { DEMO } from '../../lib/seed'
import { useSession } from '../../lib/session'
import type { Profile, Role } from '../../lib/types'
import { RoleCards } from './RoleCards'
import { Btn, Dialog, ErrorBox, Fld } from '../../components/ui'

/** Sign-up / sign-in, opened only when an action needs an account (apply, post). */
export function AuthDialog() {
  const { authRequest, closeAuth, setProfile, refresh } = useSession()
  const cfg = useAppConfig()
  const { t, locale } = useI18n()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [f, setF] = useState({ full_name: '', phone: '', password: '', business_name: '', address: '', city: 'TP.HCM' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  // Inside Zalo the default is "continue with Zalo" (no typing, no password); the old form stays as a fallback.
  const [viaZalo, setViaZalo] = useState(IN_ZALO)
  const [zalo, setZalo] = useState<{ ticket: string; phone: string; name: string | null } | null>(null)
  // the real site starts with Zalo / Google; "use a phone number" opens the same phone + password form the demo builds show at once
  const [viaPhone, setViaPhone] = useState(false)
  // Every time the dialog opens it starts fresh (no leftover signup ticket / error from last time).
  // the role a new account starts with: pre-selected from the button pressed, changeable on the sign-up form
  const [pick, setPick] = useState<Role | null>(null)
  useEffect(() => {
    if (authRequest) { setViaZalo(IN_ZALO); setViaPhone(false); setZalo(null); setError(null); setPick(null) }
  }, [authRequest])
  if (!authRequest) return null
  const role: Role = pick ?? authRequest.role
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

  const zaloContinue = async () => {
    tap()
    setBusy(true)
    setError(null)
    try {
      const creds: ZaloCredentials = await getZaloCredentials()
      const r = await api.zaloLogin(creds)
      if ('profile' in r) {
        setProfile(r.profile)
        closeAuth()
        authRequest.onDone?.(r.profile)
      } else {
        setF((c) => ({ ...c, full_name: c.full_name || creds.name || '' }))
        setZalo({ ticket: r.ticket, phone: r.phone, name: creds.name })
      }
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  const googleContinue = async () => {
    tap()
    setBusy(true)
    setError(null)
    try {
      try { localStorage.setItem('vtv-intended-role', role) } catch { /* storage unavailable */ }
      await api.signInWithGoogle() // real: leaves the page and comes back signed in; mock: returns at once
      await refresh()
      closeAuth()
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  const googleBtn = cfg?.google_login === 'on'
    ? <Btn v={locale === 'en' ? 'primary' : 'ghost'} block onClick={googleContinue} disabled={busy}>{t('googleContinue')}</Btn>
    : null

  const zaloSignup = (e: FormEvent) => {
    e.preventDefault()
    tap()
    return run(() => api.zaloSignUp(zalo!.ticket, {
      full_name: f.full_name, role, locale,
      business_name: role === 'employer' ? f.business_name : undefined,
      address: role === 'employer' ? f.address : undefined,
      city: f.city,
    }))
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
  if (!IN_ZALO && !ALLOW_PASSWORD && !viaPhone) {
    return (
      <Dialog onClose={closeAuth} label={t('loginTitle')}>
        <img className="wavecorner" src={capy('wave')} alt="" />
        <h2>{t('loginTitle')}</h2>
        {cfg?.zalo_published === 'on' ? (
          <div className="card stack" style={{ boxShadow: 'none' }}>
            <b>{t('zaloOpenTitle')}</b>
            <div className="sub" style={{ fontSize: 14 }}>{t('zaloOpenText')}</div>
            <a className="btn btn-primary block" href="https://zalo.me/s/2847107362388346804/" target="_blank" rel="noreferrer">{t('zaloOpenBtn')}</a>
          </div>
        ) : (
          <div className="notice info"><b>{t('zaloSoonTitle')}</b><br />{t('zaloSoonText')}</div>
        )}
        {googleBtn && (
          <div className="card stack" style={{ boxShadow: 'none' }}>
            <b>{t(cfg?.zalo_published === 'on' ? 'intlTitle' : 'googleOnlyTitle')}</b>
            <div className="sub" style={{ fontSize: 14 }}>{t(cfg?.zalo_published === 'on' ? 'intlText' : 'googleOnlyText')}</div>
            {googleBtn}
          </div>
        )}
        <div className="card stack" style={{ boxShadow: 'none' }}>
          <b>{t('authPhoneTitle')}</b>
          <div className="sub" style={{ fontSize: 14 }}>{t('authPhoneText')}</div>
          <Btn block onClick={() => { setMode('signup'); setViaPhone(true); setError(null) }}>{t('authPhoneSignup')}</Btn>
          <Btn v="ghost" block onClick={() => { setMode('login'); setViaPhone(true); setError(null) }}>{t('authPhoneLogin')}</Btn>
        </div>
        {error != null && <ErrorBox error={error} where="AuthDialog.web" />}
      </Dialog>
    )
  }
  if (viaZalo) {
    const emp = role === 'employer'
    return (
      <Dialog onClose={closeAuth} label={t('zaloTitle')}>
        <img className="wavecorner" src={capy('wave')} alt="" />
        <h2>{zalo ? t('zaloNewTitle') : t('zaloTitle')}</h2>
        {!zalo ? (
          <>
            <div className="sub" style={{ marginTop: -8 }}>{t('zaloWhy')}</div>
            {error != null && <ErrorBox error={error} where="AuthDialog.zalo" />}
            <Btn block onClick={zaloContinue} disabled={busy}>{busy ? '…' : t('zaloContinue')}</Btn>
            {/* the real server has no phone+password sign-up, so the fallback only exists in the mock/demo builds */}
            {ALLOW_PASSWORD && <Btn v="text" block onClick={() => { setViaZalo(false); setError(null) }}>{t('zaloOther')}</Btn>}
          </>
        ) : (
          <form className="stack" onSubmit={zaloSignup}>
            <div className="notice ok">{t('zaloPhone')}: <b>+{zalo.phone}</b></div>
            <Fld label={t('roleQuestion')}><RoleCards value={role} onChange={setPick} /></Fld>
            <Fld label={t('yourName')} htmlFor="a-name"><input id="a-name" className="inp" value={f.full_name} onChange={set('full_name')} autoComplete="name" required maxLength={80} /></Fld>
            {emp && (
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
            {error != null && <ErrorBox error={error} where="AuthDialog.zaloSignup" />}
            <Btn block type="submit" disabled={busy}>{busy ? '…' : emp ? t('saveAndPost') : role === 'seeker' ? t('applyNow') : t('continue')}</Btn>
          </form>
        )}
      </Dialog>
    )
  }
  const employerSignup = mode === 'signup' && role === 'employer'
  const title = mode === 'login' ? t('loginTitle') : role === 'employer' ? t('hireHello') : t('loginHello')

  return (
    <Dialog onClose={closeAuth} label={title}>
      <img className="wavecorner" src={capy('wave')} alt="" />
      <h2>{title}</h2>
      {mode === 'signup' && <div className="sub" style={{ marginTop: -8 }}>{role === 'employer' ? t('authEmployerSub') : t('authSeekerSub')}</div>}
      {!IN_ZALO && googleBtn}
      <form className="stack" onSubmit={submit}>
        {mode === 'signup' && <Fld label={t('roleQuestion')}><RoleCards value={role} onChange={setPick} /></Fld>}
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
        <Fld label={t('phone')} htmlFor="a-phone" hint={!ALLOW_PASSWORD && mode === 'signup' ? t('phoneUnverifiedHint') : undefined}><input id="a-phone" className="inp" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required placeholder="0901 234 567" /></Fld>
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
      {IN_ZALO && <Btn v="text" block onClick={() => { setViaZalo(true); setError(null) }}>{t('zaloBack')}</Btn>}
      {viaPhone && !ALLOW_PASSWORD && <Btn v="text" block onClick={() => { setViaPhone(false); setError(null) }}>{t('authPhoneBack')}</Btn>}
      {IS_DEMO && <Btn v="text" block disabled={busy} onClick={() => run(() => api.signIn(d.phone, d.password))}>{role === 'seeker' ? t('demoSeeker') : t('demoEmployer')}</Btn>}
    </Dialog>
  )
}
