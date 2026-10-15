import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorBox } from '../components/ErrorBox'
import { Topbar } from '../components/Topbar'
import { api } from '../lib/api'
import { initials } from '../lib/format'
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

  const Lang = (
    <div className="card">
      <div className="row between">
        <span className="bold">🌐 {t('language')}</span>
        <div className="row" style={{ gap: 6 }}>
          <button className={locale === 'vi' ? 'filter on' : 'filter'} onClick={() => changeLang('vi')}>Tiếng Việt</button>
          <button className={locale === 'en' ? 'filter on' : 'filter'} onClick={() => changeLang('en')}>English</button>
        </div>
      </div>
    </div>
  )

  if (!profile) {
    return (
      <div className="page-enter">
        <Topbar title={t('accountTitle')} />
        <div className="card center">
          <div className="empty" style={{ padding: '16px 0' }}><div className="big">👋</div>{t('guestAccount')}</div>
          <button className="btn primary block" onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</button>
        </div>
        {Lang}
        <p className="center small mt-24"><Link to="/dieu-khoan">{t('legal')}</Link></p>
      </div>
    )
  }

  const emp = profile.role === 'employer'
  return (
    <div className="page-enter">
      <Topbar title={t('accountTitle')} />
      <div className="card">
        <div className="row" style={{ gap: 12 }}>
          <div className="avatar">{initials(emp ? profile.business_name || profile.full_name : profile.full_name)}</div>
          <div className="grow">
            <div className="bold">{emp ? profile.business_name || profile.full_name : profile.full_name}</div>
            <div className="muted small">{displayPhone(profile.phone)}</div>
          </div>
          {emp && <span className={profile.plan === 'pro' ? 'badge pro' : 'badge gray'}>{t(profile.plan === 'pro' ? 'planpro' : 'planfree')}</span>}
        </div>
      </div>

      <div className="card stack">
        <div className="field">
          <label htmlFor="ac-name">{t('yourName')}</label>
          <input id="ac-name" className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={80} />
        </div>
        {emp ? (
          <>
            <div className="field">
              <label htmlFor="ac-biz">{t('businessName')}</label>
              <input id="ac-biz" className="input" value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} maxLength={120} />
            </div>
            <div className="field">
              <label htmlFor="ac-addr">{t('address')}</label>
              <input id="ac-addr" className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} maxLength={200} />
            </div>
          </>
        ) : (
          <div className="field">
            <label htmlFor="ac-bio">{t('bio')}</label>
            <textarea id="ac-bio" className="textarea" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder={t('bioPh')} maxLength={500} />
          </div>
        )}
        <div className="field">
          <label htmlFor="ac-city">{t('city')}</label>
          <select id="ac-city" className="select" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
            <option value="">—</option>
            {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {error != null && <ErrorBox error={error} where="Account.save" />}
        <button className="btn secondary block" onClick={save} disabled={saving || !f.full_name.trim()}>{saving ? '…' : saved ? t('saved') : t('save')}</button>
      </div>

      {Lang}
      {emp && (
        <div className="card tappable row between" onClick={() => nav('/app/bang-gia')} role="button" tabIndex={0}>
          <span className="bold">💎 {t('pricing')}</span><span className="muted">›</span>
        </div>
      )}
      <p className="center small mt-16"><Link to="/dieu-khoan">{t('legal')}</Link></p>
      <div className="center mt-24" style={{ marginTop: 40 }}>
        <button className="btn danger-text" onClick={out}>{t('signOut')}</button>
      </div>
    </div>
  )
}
