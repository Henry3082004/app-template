import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { CITIES } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { Role } from '../lib/types'
import { Ic } from './Ic'
import { Btn, Dialog, ErrorBox, Fld } from './ui'

const HOME: Record<Role, string> = { seeker: '/app', employer: '/app/tin-cua-toi' }

/**
 * Account → Roles. One role: offer to add the other (same account, separate reputation).
 * Both roles: switch between them with one tap.
 */
export function RolesCard() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, setProfile, askIntro } = useSession()
  const [biz, setBiz] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  if (!profile) return null

  const act = async (fn: () => Promise<void>) => {
    tap(); setBusy(true); setError(null)
    try { await fn() } catch (e) { setError(e) } finally { setBusy(false) }
  }
  const switchTo = (r: Role) => act(async () => { setProfile(await api.switchRole(r)); nav(HOME[r]) })
  const addSeeker = () => act(async () => { setProfile(await api.addRole('seeker')); nav(HOME.seeker); askIntro({}) })

  const both = profile.roles.length > 1
  return (
    <div className="card stack">
      <b>{t('rolesTitle')}</b>
      {both ? (
        <Fld label={t('roleInUse')}>
          <div className="seg">
            <button type="button" className={profile.role === 'seeker' ? 'on' : ''} disabled={busy} onClick={() => profile.role !== 'seeker' && switchTo('seeker')}>{t('roleCardSeeker')}</button>
            <button type="button" className={profile.role === 'employer' ? 'on' : ''} disabled={busy} onClick={() => profile.role !== 'employer' && switchTo('employer')}>{t('roleCardEmployer')}</button>
          </div>
        </Fld>
      ) : profile.role === 'seeker' ? (
        <>
          <div className="sub" style={{ fontSize: 14 }}>{t('addEmployerSub')}</div>
          <Btn v="ghost" disabled={busy} onClick={() => setBiz(true)}><Ic n="store" size={18} /> {t('addEmployerRole')}</Btn>
        </>
      ) : (
        <>
          <div className="sub" style={{ fontSize: 14 }}>{t('addSeekerSub')}</div>
          <Btn v="ghost" disabled={busy} onClick={addSeeker}><Ic n="briefcase" size={18} /> {busy ? '…' : t('addSeekerRole')}</Btn>
        </>
      )}
      {error != null && <ErrorBox error={error} where="RolesCard" />}
      {biz && <AddBusinessDialog onClose={() => setBiz(false)} onDone={() => { setBiz(false); nav(HOME.employer) }} />}
    </div>
  )
}

function AddBusinessDialog({ onClose, onDone }: { onClose(): void; onDone(): void }) {
  const { t } = useI18n()
  const { profile, setProfile } = useSession()
  const [f, setF] = useState({ business_name: '', address: '', city: profile?.city || 'TP.HCM' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); tap(); setBusy(true); setError(null)
    try { setProfile(await api.addRole('employer', f)); onDone() } catch (err) { setError(err) } finally { setBusy(false) }
  }
  return (
    <Dialog onClose={onClose} label={t('addBusinessTitle')}>
      <h2>{t('addBusinessTitle')}</h2>
      <form className="stack" onSubmit={submit}>
        <Fld label={t('businessName')} htmlFor="r-biz"><input id="r-biz" className="inp" value={f.business_name} onChange={set('business_name')} required maxLength={120} placeholder="VD: Quán Cơm Bà Năm" /></Fld>
        <div className="formgrid">
          <Fld label={t('address')} htmlFor="r-addr"><input id="r-addr" className="inp" value={f.address} onChange={set('address')} required maxLength={200} /></Fld>
          <Fld label={t('city')} htmlFor="r-city">
            <select id="r-city" className="inp" value={f.city} onChange={set('city')}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select>
          </Fld>
        </div>
        {error != null && <ErrorBox error={error} where="AddBusinessDialog" />}
        <Btn block type="submit" disabled={busy}>{busy ? '…' : t('addBusinessBtn')}</Btn>
      </form>
    </Dialog>
  )
}
