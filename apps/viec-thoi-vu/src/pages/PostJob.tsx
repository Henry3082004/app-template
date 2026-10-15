import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Dock } from '../components/Dock'
import { ErrorBox } from '../components/ErrorBox'
import { SuccessScreen } from '../components/SuccessScreen'
import { Topbar } from '../components/Topbar'
import { api } from '../lib/api'
import { errorCode } from '../lib/errors'
import { addDays, today } from '../lib/format'
import { CITIES } from '../lib/geo'
import { tap } from '../lib/haptics'
import { useI18n, type TKey } from '../lib/i18n'
import { report } from '../lib/sentry'
import { useSession } from '../lib/session'
import type { Category, JobInput, PayUnit } from '../lib/types'

const CATS: Category[] = ['service', 'warehouse', 'event', 'farm', 'retail', 'other']
const UNITS: PayUnit[] = ['hour', 'day', 'shift', 'job']

export default function PostJob() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready } = useSession()
  const start = addDays(today(), 1)
  const [f, setF] = useState<JobInput>({
    title: '', description: '', category: 'service', pay_amount: 30000, pay_unit: 'hour',
    start_date: start, end_date: addDays(start, 6), shift_note: '', address: profile?.address ?? '',
    city: profile?.city && CITIES[profile.city] ? profile.city : 'TP.HCM', lat: null, lng: null, slots: 2, is_urgent: false,
  })
  const [prefilled, setPrefilled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [formErr, setFormErr] = useState<TKey | null>(null)
  const [done, setDone] = useState(false)
  const isPro = profile?.plan === 'pro'

  useEffect(() => {
    if (profile?.role !== 'employer') return
    api.myJobs().then((list) => {
      const last = list[0]
      if (!last) return
      setF((cur) => ({
        ...cur, title: last.title, description: last.description ?? '', category: last.category, pay_amount: last.pay_amount,
        pay_unit: last.pay_unit, shift_note: last.shift_note ?? '', address: last.address, city: last.city,
        lat: last.lat, lng: last.lng, slots: last.slots,
      }))
      setPrefilled(true)
    }).catch(() => undefined)
  }, [profile])

  if (!ready) return null
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />

  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => setF((cur) => ({ ...cur, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    tap()
    setFormErr(null)
    setError(null)
    if (!f.title.trim() || !f.address.trim()) return setFormErr('required')
    if (f.end_date < f.start_date) return setFormErr('endBeforeStart')
    const c = CITIES[f.city] ?? CITIES['Khác']
    const input: JobInput = {
      ...f, title: f.title.trim(), address: f.address.trim(), description: f.description.trim(), shift_note: f.shift_note.trim(),
      lat: f.lat ?? c.lat, lng: f.lng ?? c.lng, is_urgent: isPro && f.is_urgent,
    }
    setBusy(true)
    try {
      await api.createJob(input)
      setDone(true)
    } catch (err) {
      if (errorCode(err) === 'UNKNOWN') report(err, { where: 'createJob' })
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <SuccessScreen title={t('postedTitle')} text={t('postedText')}>
        <button className="btn primary block" onClick={() => nav('/app/tin-cua-toi')}>{t('backToMyJobs')}</button>
      </SuccessScreen>
    )
  }

  const limit = errorCode(error) === 'FREE_PLAN_LIMIT' || errorCode(error) === 'URGENT_REQUIRES_PRO'

  return (
    <form className="page-enter" onSubmit={submit} noValidate>
      <Topbar title={t('postTitle')} back="/app/tin-cua-toi" />
      {prefilled && <p className="subtitle">✨ {t('prefilled')}</p>}
      <div className="card stack">
        <div className="field">
          <label htmlFor="p-title">{t('jobTitle')}</label>
          <input id="p-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={t('jobTitlePh')} maxLength={120} required />
        </div>
        <div className="field">
          <label>{t('category')}</label>
          <div className="row wrap" style={{ gap: 6 }}>
            {CATS.map((c) => (
              <button type="button" key={c} className={f.category === c ? 'filter on' : 'filter'} onClick={() => set('category', c)}>{t(`cat${c}` as TKey)}</button>
            ))}
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="p-pay">{t('pay')}</label>
            <input id="p-pay" className="input" type="number" inputMode="numeric" min={1000} step={1000} value={f.pay_amount || ''} onChange={(e) => set('pay_amount', Number(e.target.value))} required />
          </div>
          <div className="field">
            <label htmlFor="p-unit">{t('unit')}</label>
            <select id="p-unit" className="select" value={f.pay_unit} onChange={(e) => set('pay_unit', e.target.value as PayUnit)}>
              {UNITS.map((u) => <option key={u} value={u}>{t(`u${u}` as TKey)}</option>)}
            </select>
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="p-start">{t('startDate')}</label>
            <input id="p-start" className="input" type="date" value={f.start_date} min={today()} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="p-end">{t('endDate')}</label>
            <input id="p-end" className="input" type="date" value={f.end_date} min={f.start_date} onChange={(e) => set('end_date', e.target.value)} />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="p-shift">{t('shiftNote')}</label>
            <input id="p-shift" className="input" value={f.shift_note} onChange={(e) => set('shift_note', e.target.value)} placeholder={t('shiftNotePh')} maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="p-slots">{t('slotsNeed')}</label>
            <input id="p-slots" className="input" type="number" inputMode="numeric" min={1} max={200} value={f.slots || ''} onChange={(e) => set('slots', Math.max(1, Math.min(200, Number(e.target.value) || 1)))} />
          </div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="p-addr">{t('address')}</label>
            <input id="p-addr" className="input" value={f.address} onChange={(e) => setF((c) => ({ ...c, address: e.target.value, lat: null, lng: null }))} maxLength={200} required />
          </div>
          <div className="field">
            <label htmlFor="p-city">{t('city')}</label>
            <select id="p-city" className="select" value={f.city} onChange={(e) => setF((c) => ({ ...c, city: e.target.value, lat: null, lng: null }))}>
              {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="p-desc">{t('description')}</label>
          <textarea id="p-desc" className="textarea" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder={t('descriptionPh')} maxLength={2000} />
        </div>
        <label className="switch">
          <span>{t('urgentToggle')} <span className="badge pro">{t('proOnly')}</span></span>
          <input type="checkbox" checked={isPro && f.is_urgent} disabled={!isPro} onChange={(e) => set('is_urgent', e.target.checked)} />
        </label>
        {!isPro && <button type="button" className="btn ghost small" style={{ alignSelf: 'flex-start', paddingLeft: 0, marginTop: -8 }} onClick={() => nav('/app/bang-gia')}>{t('upgrade')} →</button>}
      </div>
      {formErr && <div className="notice error mt-12" role="alert">{t(formErr)}</div>}
      {error != null && (
        <div className="mt-12">
          <ErrorBox error={error} where="PostJob.submit" />
          {limit && <button type="button" className="btn secondary block mt-8" onClick={() => nav('/app/bang-gia')}>{t('upgrade')}</button>}
        </div>
      )}
      <Dock>
        <button className="btn primary block" type="submit" disabled={busy}>{busy ? '…' : t('submitPost')}</button>
      </Dock>
    </form>
  )
}
