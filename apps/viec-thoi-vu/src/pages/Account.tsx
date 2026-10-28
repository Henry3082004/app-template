import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BankCard, MyReviews, OwnRepTiles } from '../components/escrow'
import { useAppConfig } from '../lib/config'
import { LegalLinks } from '../components/LegalLinks'
import { LogoPicker } from '../components/LogoPicker'
import { Ic } from '../components/Ic'
import { RolesCard } from '../components/RolesCard'
import { Avatar, Btn, Empty, ErrorBox, Fld } from '../components/ui'
import { WorkerFields, workerInfoOf } from '../components/WorkerFields'
import { CITIES } from '../lib/geo'
import { useI18n, type TKey } from '../lib/i18n'
import { DeleteAccount } from '../components/DeleteAccount'
import { Discoverable } from '../components/Discoverable'
import { Regulars } from '../components/Regulars'
import { displayPhone } from '../lib/phone'
import { useSession } from '../lib/session'
import type { Locale, WorkerInfo } from '../lib/types'
import { avatarUrl } from '../lib/worker'

export default function Account() {
  const { t, locale, setLocale } = useI18n()
  const nav = useNavigate()
  const { profile, updateProfile, signOut, askAuth, askQuiz, setViewAsUser } = useSession()
  const cfg = useAppConfig()
  const [f, setF] = useState({ full_name: '', bio: '', business_name: '', address: '', city: '' })
  const [w, setW] = useState<WorkerInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (profile) setF({ full_name: profile.full_name, bio: profile.bio ?? '', business_name: profile.business_name ?? '', address: profile.address ?? '', city: profile.city ?? '' })
    if (profile) setW(workerInfoOf(profile))
  }, [profile])

  const changeLang = (l: Locale) => {
    setLocale(l)
    if (profile) updateProfile({ locale: l }).catch(() => undefined)
  }

  const save = async () => {
    setSaving(true); setSaved(false); setError(null)
    try {
      const patch = profile?.role === 'employer'
        ? { full_name: f.full_name.trim(), business_name: f.business_name.trim() || null, address: f.address.trim() || null, city: f.city || null }
        : { full_name: f.full_name.trim(), bio: f.bio.trim() || null, city: f.city || null, ...w }
      await updateProfile(patch)
      setSaved(true)
    } catch (e) { setError(e) } finally { setSaving(false) }
  }

  const out = async () => {
    if (!confirm(t('signOutConfirm'))) return
    await signOut()
    nav('/app')
  }

  const lang = (
    <div className="stack">
      <Fld label={t('language')}>
        <div className="seg">
          <button type="button" className={locale === 'vi' ? 'on' : ''} onClick={() => changeLang('vi')}>Tiếng Việt</button>
          <button type="button" className={locale === 'en' ? 'on' : ''} onClick={() => changeLang('en')}>English</button>
        </div>
      </Fld>
      {profile?.role === 'employer' && cfg?.billing === 'on' && <Btn v="ghost" onClick={() => nav('/app/bang-gia')}><Ic n="gem" size={18} /> {t('pricing')}</Btn>}
    </div>
  )

  if (!profile) {
    return (
      <div className="page-scroll"><div className="pg">
        <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('accountTitle')}</h1>
        <div className="acct">
          <div className="card"><Empty pose="wave" title={t('guestAccount')}><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</Btn></Empty></div>
          <div className="card">{lang}</div>
        </div>
        <p className="center small mt24"><Link to="/dieu-khoan">{t('legal')}</Link></p>
      </div></div>
    )
  }

  const emp = profile.role === 'employer'
  const name = emp ? profile.business_name || profile.full_name : profile.full_name
  const form = (
    <div className="stack">
      <Fld label={t('yourName')} htmlFor="ac-name"><input id="ac-name" className="inp" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} maxLength={80} /></Fld>
      {emp ? (
        <>
          <LogoPicker name={name} path={profile.logo_path} />
          <Fld label={t('businessName')} htmlFor="ac-biz"><input id="ac-biz" className="inp" value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} maxLength={120} /></Fld>
          <Fld label={t('address')} htmlFor="ac-addr"><input id="ac-addr" className="inp" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} maxLength={200} /></Fld>
        </>
      ) : (
        <Fld label={t('bio')} htmlFor="ac-bio"><textarea id="ac-bio" className="inp" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder={t('bioPh')} maxLength={500} /></Fld>
      )}
      {!emp && w && <><b style={{ marginTop: 8 }}>{t('workerInfo')}</b><WorkerFields name={name} value={w} onChange={setW} /></>}
      <Fld label={t('city')} htmlFor="ac-city">
        <select id="ac-city" className="inp" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
          <option value="">—</option>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
        </select>
      </Fld>
      {error != null && <ErrorBox error={error} where="Account.save" />}
      <Btn block onClick={save} disabled={saving || !f.full_name.trim()}>{saving ? '…' : saved ? t('saved') : t('save')}</Btn>
    </div>
  )
  return (
    <div className="page-scroll"><div className="pg acctpage">
      <h1 className="ptitle">{t('accountTitle')}</h1>
      {/* who I am at a glance: photo, name, phone, my numbers */}
      <section className="card profhead">
        <div className="row">
          <Avatar square={emp} size={72} name={name} src={avatarUrl(emp ? profile.logo_path : w?.avatar_path)} />
          <div className="who">
            <b>{name}</b>
            <span className="sub">{profile.phone ? displayPhone(profile.phone) : t('noPhoneYet')}</span>
            <span className="tags">
              {profile.phone && <span className={profile.auth_provider === 'zalo' ? 'tag ok' : 'tag warn'}>{t(profile.auth_provider === 'zalo' ? 'phoneVerified' : 'phoneUnverified')}</span>}
              {emp && cfg?.billing === 'on' && <span className={profile.plan === 'pro' ? 'tag sun' : 'tag'}>{t(profile.plan === 'pro' ? 'planpro' : 'planfree')}</span>}
            </span>
          </div>
        </div>
        <b className="small muted">{t('repTitle')}</b>
        <OwnRepTiles userId={profile.id} employer={emp} />
      </section>
      <Sect title={t('secInfo')} sub={t(emp ? 'secInfoEmployer' : 'secInfoSeeker')}>{form}</Sect>
      {!emp && <Sect title={t('discoverTitle')} sub={t('discoverSub')}><Discoverable /></Sect>}
      {emp && <Sect title={t('regularsTitle')} sub={t('regularsSub')}><Regulars /></Sect>}
      <Sect title={t('secVerify')} sub={t(emp ? 'secVerifySubEmp' : 'secVerifySub')}>
        <div className="stack">
          <div className={'notice ' + (profile.auth_provider === 'zalo' ? 'ok' : 'warn')}>{t(profile.auth_provider === 'zalo' ? 'verifyPhoneOk' : 'verifyPhoneNo')}</div>
          <div className="sub" style={{ fontSize: 14 }}>{t('verifyId')}</div>
        </div>
      </Sect>
      <Sect title={t('myReviewsTitle')} sub={t('secReviewsSub')}><MyReviews employer={emp} /></Sect>
      <Sect title={t('rolesTitle')} sub={t('secRolesSub')}><RolesCard /></Sect>
      {!emp && <Sect title={t('bankTitle')} sub={t('secBankSub')}><BankCard /></Sect>}
      <Sect title={t('secSettings')} sub={t('secSettingsSub')}>
        <div className="stack">
          {lang}
          <div className="sub" style={{ fontSize: 14 }}>{t('signInVia', { x: t(profile.auth_provider === 'zalo' ? 'viaZalo' : profile.auth_provider === 'google' ? 'viaGoogle' : 'viaPassword') })}</div>
        </div>
      </Sect>
      <Sect title={t('deleteTitle')} sub={t('deleteSub')}><DeleteAccount /></Sect>
      <Sect title={t('secHelpGuide')} sub={t('secHelpGuideSub')}>
        <div className="stack">
          {(['faq1', 'faq2', 'faq3'] as const).map((k) => <div key={k}><b>{t(`${k}q` as TKey)}</b><div className="sub" style={{ fontSize: 14 }}>{t(`${k}a` as TKey)}</div></div>)}
          <LegalLinks />
        </div>
      </Sect>
      {profile.is_admin && (
        <section className="card devtools">
          <b><Ic n="sparkles" size={18} /> {t('devTools')}</b>
          <div className="sub" style={{ fontSize: 14 }}>{t('devToolsSub')}</div>
          <div className="lab">{t('quizAdminTitle')}</div>
          <div className="sub" style={{ fontSize: 13 }}>{t('quizAdminHint')}</div>
          <Btn v="ghost" block onClick={() => askQuiz({ all: true })}>{t('quizAdminBtn')}</Btn>
          <Btn v="ghost" block onClick={() => nav('/app/quan-tri')}>{t('openAdmin')}</Btn>
          <div className="lab">{t('viewAsTitle')}</div>
          <div className="sub" style={{ fontSize: 13 }}>{t('viewAsHint')}</div>
          <Btn block onClick={() => { setViewAsUser(true); nav('/app') }}>{t('viewAsBtn')}</Btn>
        </section>
      )}
      <Btn v="danger" block className="signout" onClick={out}><Ic n="logout" size={18} /> {t('signOut')}</Btn>
      <div className="sub center" style={{ fontSize: 13 }}>{t('byeSub')}</div>
    </div></div>
  )
}

/** One tappable row of the profile page; opens in place. */
function Sect({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <details className="arow">
      <summary><span><b>{title}</b>{sub && <small>{sub}</small>}</span><Ic n="chevR" size={18} /></summary>
      <div className="abody">{children}</div>
    </details>
  )
}
