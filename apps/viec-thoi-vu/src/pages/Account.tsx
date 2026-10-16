import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BankCard, OwnReputation } from '../components/Escrow'
import { Ic } from '../components/Ic'
import { Avatar, Btn, Empty, ErrorBox, Fld } from '../components/ui'
import { api } from '../lib/api'
import { CITIES } from '../lib/geo'
import { useI18n } from '../lib/i18n'
import { displayPhone } from '../lib/phone'
import { useSession } from '../lib/session'
import type { Locale } from '../lib/types'

export default function Account() {
  const { t, locale, setLocale } = useI18n()
  const nav = useNavigate()
  const { profile, setProfile, signOut, askAuth } = useSession()
  const [f, setF] = useState({ full_name: '', bio: '', business_name: '', address: '', city: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (profile) setF({ full_name: profile.full_name, bio: profile.bio ?? '', business_name: profile.business_name ?? '', address: profile.address ?? '', city: profile.city ?? '' })
  }, [profile])

  const changeLang = (l: Locale) => {
    setLocale(l)
    if (profile) api.updateProfile({ locale: l }).then(setProfile).catch(() => undefined)
  }

  const save = async () => {
    setSaving(true); setSaved(false); setError(null)
    try {
      const patch = profile?.role === 'employer'
        ? { full_name: f.full_name.trim(), business_name: f.business_name.trim() || null, address: f.address.trim() || null, city: f.city || null }
        : { full_name: f.full_name.trim(), bio: f.bio.trim() || null, city: f.city || null }
      setProfile(await api.updateProfile(patch))
      setSaved(true)
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  const out = async () => {
    if (!confirm(t('signOutConfirm'))) return
    await signOut()
    nav('/app')
  }

  const lang = (
    <div className="card stack">
      <Fld label={t('language')}>
        <div className="seg">
          <button type="button" className={locale === 'vi' ? 'on' : ''} onClick={() => changeLang('vi')}>Tiếng Việt</button>
          <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => changeLang('en')}>English</button>
        </div>
      </Fld>
      {profile?.role === 'employer' && <Btn v="ghost" onClick={() => nav('/app/bang-gia')}><Ic n="gem" size={18} /> {t('pricing')}</Btn>}
    </div>
  )

  if (!profile) {
    return (
      <div className="page-scroll"><div className="pg">
        <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('accountTitle')}</h1>
        <div className="acct">
          <div className="card"><Empty pose="wave" title={t('guestAccount')}><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</Btn></Empty></div>
          {lang}
        </div>
        <p className="center small mt24"><Link to="/dieu-khoan">{t('legal')}</Link></p>
      </div></div>
    )
  }

  const emp = profile.role === 'employer'
  const name = emp ? profile.business_name || profile.full_name : profile.full_name
  return (
    <div className="page-scroll"><div className="pg">
      <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('accountTitle')}</h1>
      <div className="acct">
        <div className="card stack">
          <div className="row"><Avatar name={name} /><div style={{ flex: 1, minWidth: 0 }}><b>{name}</b><div className="sub" style={{ fontSize: 14 }}>{displayPhone(profile.phone)}</div></div>{emp && <span className={profile.plan === 'pro' ? 'tag sun' : 'tag'}>{t(profile.plan === 'pro' ? 'planpro' : 'planfree')}</span>}</div>
          <Fld label={t('yourName')} htmlFor="ac-name"><input id="ac-name" className="inp" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={80} /></Fld>
          {emp ? (
            <>
              <Fld label={t('businessName')} htmlFor="ac-biz"><input id="ac-biz" className="inp" value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} maxLength={120} /></Fld>
              <Fld label={t('address')} htmlFor="ac-addr"><input id="ac-addr" className="inp" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} maxLength={200} /></Fld>
            </>
          ) : (
            <Fld label={t('bio')} htmlFor="ac-bio"><textarea id="ac-bio" className="inp" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder={t('bioPh')} maxLength={500} /></Fld>
          )}
          <Fld label={t('city')} htmlFor="ac-city">
            <select id="ac-city" className="inp" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
              <option value="">—</option>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
            </select>
          </Fld>
          {error != null && <ErrorBox error={error} where="Account.save" />}
          <Btn v="ghost" block onClick={save} disabled={saving || !f.full_name.trim()}>{saving ? '…' : saved ? t('saved') : t('save')}</Btn>
        </div>
        <OwnReputation userId={profile.id} employer={emp} />
        {!emp && <BankCard />}
        {lang}
      </div>
      <p className="small mt24"><Link to="/dieu-khoan">{t('legal')}</Link></p>
      <div style={{ marginTop: 40 }}>
        <Btn v="text" onClick={out}>{t('signOut')}</Btn>
        <div className="sub" style={{ fontSize: 13 }}>{t('byeSub')}</div>
      </div>
    </div></div>
  )
}
