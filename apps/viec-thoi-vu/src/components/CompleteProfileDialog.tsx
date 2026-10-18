import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { capy } from '../lib/capy'
import { CITIES } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { Role } from '../lib/types'
import { Btn, Dialog, ErrorBox, Fld } from './ui'

/** Shown right after a first Google sign-in: we still need the role, a name and a phone number. */
export function CompleteProfileDialog() {
  const { pending, setProfile, refresh, signOut } = useSession()
  const { t, locale } = useI18n()
  const [role, setRole] = useState<Role>('seeker')
  const [f, setF] = useState({ full_name: '', phone: '', business_name: '', address: '', city: 'TP.HCM' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (!pending) return
    setF((c) => ({ ...c, full_name: c.full_name || pending.name || '' }))
    try { if (localStorage.getItem('vtv-intended-role') === 'employer') setRole('employer') } catch { /* storage unavailable */ }
  }, [pending])

  if (!pending) return null
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const emp = role === 'employer'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    tap()
    setBusy(true)
    setError(null)
    try {
      const p = await api.completeProfile({
        role, full_name: f.full_name, phone: f.phone, locale,
        business_name: emp ? f.business_name : undefined, address: emp ? f.address : undefined, city: f.city,
      })
      setProfile(p)
      await refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog label={t('googleCompleteTitle')}>
      <img className="wavecorner" src={capy('wave')} alt="" />
      <h2>{t('googleCompleteTitle')}</h2>
      {pending.email && <div className="sub" style={{ marginTop: -8 }}>{t('signedInAs')} {pending.email}</div>}
      <form className="stack" onSubmit={submit}>
        <Fld label={t('iAm')}>
          <div className="seg">
            <button type="button" className={role === 'seeker' ? 'on' : ''} onClick={() => setRole('seeker')}>{t('roleSeeker')}</button>
            <button type="button" className={role === 'employer' ? 'on' : ''} onClick={() => setRole('employer')}>{t('roleEmployer')}</button>
          </div>
        </Fld>
        <Fld label={t('yourName')} htmlFor="c-name"><input id="c-name" className="inp" value={f.full_name} onChange={set('full_name')} autoComplete="name" required maxLength={80} /></Fld>
        <Fld label={t('phoneIntl')} htmlFor="c-phone" hint={t('phoneIntlHint')}>
          <input id="c-phone" className="inp" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" required placeholder={t('phoneIntlPh')} />
        </Fld>
        {emp && (
          <>
            <Fld label={t('businessName')} htmlFor="c-biz"><input id="c-biz" className="inp" value={f.business_name} onChange={set('business_name')} required maxLength={120} /></Fld>
            <div className="formgrid">
              <Fld label={t('address')} htmlFor="c-addr"><input id="c-addr" className="inp" value={f.address} onChange={set('address')} required maxLength={200} /></Fld>
              <Fld label={t('city')} htmlFor="c-city">
                <select id="c-city" className="inp" value={f.city} onChange={set('city')}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
              </Fld>
            </div>
          </>
        )}
        {error != null && <ErrorBox error={error} where="CompleteProfileDialog" />}
        <Btn block type="submit" disabled={busy}>{busy ? '…' : t('continue')}</Btn>
      </form>
      <Btn v="text" block onClick={() => void signOut()}>{t('completeSignOut')}</Btn>
    </Dialog>
  )
}
