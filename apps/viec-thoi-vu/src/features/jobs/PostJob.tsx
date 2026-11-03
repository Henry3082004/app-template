import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Ic } from '../../components/Ic'
import { JobCard } from './JobCard'
import { TasksField } from './TasksField'
import { Btn, Chip, Dialog, ErrorBox, Fld, Skel, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { capy } from '../../lib/capy'
import { errorCode } from '../../lib/errors'
import { addDays, today } from '../../lib/format'
import { CITIES } from '../../lib/geo'
import { tap } from '../../lib/haptics'
import { useI18n, type TKey } from '../../lib/i18n'
import { report } from '../../lib/sentry'
import { isProFor, useAppConfig } from '../../lib/config'
import { FeeNote } from '../fees/Fees'
import { clearPostDraft, loadPostDraft, savePostDraft } from '../../lib/postDraft'
import { useSession } from '../../lib/session'
import type { CapyDraft, Category, Job, JobInput, PayUnit } from '../../lib/types'
import { useBp } from '../../lib/useBp'

const CATS: Category[] = ['service', 'warehouse', 'event', 'farm', 'retail', 'other']
const UNITS: PayUnit[] = ['hour', 'day', 'shift', 'job']

export default function PostJob() {
  const { t } = useI18n()
  const nav = useNavigate()
  const [qs] = useSearchParams()
  const { state } = useLocation() as { state: { capyDraft?: CapyDraft; capyNote?: string } | null }
  const draft = state?.capyDraft ?? null
  const bp = useBp()
  const { profile, ready, askAuth } = useSession()
  const cfg = useAppConfig()
  const start = addDays(today(), 1)
  const stored = useRef(!draft && !qs.get('lai') ? loadPostDraft() : null).current // what a visitor typed before signing up
  const [f, setF] = useState<JobInput>(() => ({
    title: '', description: '', tasks: [], category: 'service', pay_amount: 30000, pay_unit: 'hour',
    start_date: start, end_date: addDays(start, 6), shift_note: '', address: profile?.address ?? '',
    city: profile?.city && CITIES[profile.city] ? profile.city : 'TP.HCM', lat: null, lng: null, slots: 2, is_urgent: false,
    ...(draft ? {
      title: draft.title, description: draft.description, category: draft.category, pay_amount: draft.pay_amount ?? 0, pay_unit: draft.pay_unit,
      slots: draft.slots, start_date: draft.start_date, end_date: draft.end_date, shift_note: draft.shift_note,
      address: draft.address || profile?.address || '', city: draft.city && CITIES[draft.city] ? draft.city : profile?.city && CITIES[profile.city] ? profile.city : 'TP.HCM', is_urgent: draft.is_urgent,
    } : {}),
    ...(stored ? stored.f : {}),
  }))
  const [prefilled, setPrefilled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [formErr, setFormErr] = useState<TKey | null>(null)
  const [done, setDone] = useState(false)
  const [held, setHeld] = useState<string | null>(null)
  const [guide, setGuide] = useState(stored?.guide ?? '')
  const isPro = isProFor(profile, cfg)

  // the shop's own address fills in as soon as the account is known (a reload, or signing in on this very form)
  useEffect(() => {
    if (profile?.role !== 'employer') return
    setF((cur) => (cur.address.trim() ? cur : { ...cur, address: profile.address ?? '', city: profile.city && CITIES[profile.city] ? profile.city : cur.city }))
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // a shop's form starts from its previous post; the form is shown once that is in (so nobody types into it and gets overwritten),
  // and nothing is overwritten when the person already typed a title (a visitor who signs in on this very form)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (profile?.role !== 'employer' || draft) return // a draft from Capi is not overwritten by the previous post
    let live = true
    api.myJobs().then((list) => {
      const last = list.find((j) => j.id === qs.get('lai')) ?? list[0]
      if (!live || !last) return
      setF((cur) => {
        if (cur.title.trim()) return cur
        setPrefilled(true)
        return {
          ...cur, title: last.title, description: last.description ?? '', tasks: last.tasks ?? [], category: last.category, pay_amount: last.pay_amount,
          pay_unit: last.pay_unit, shift_note: last.shift_note ?? '', address: last.address, city: last.city,
          lat: last.lat, lng: last.lng, slots: last.slots,
        }
      })
    }).catch(() => undefined).finally(() => { if (live) setLoaded(true) })
    return () => { live = false }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // keep what a visitor types, so signing up in the last step (or through Google) never loses the form
  useEffect(() => { if (!profile && !done) savePostDraft(f, guide) }, [f, guide, profile, done])

  if (!ready) return null
  if (profile && profile.role !== 'employer') return <Navigate to="/app" replace />
  if (profile && !draft && !loaded && !f.title.trim()) return <div className="pg"><Skel n={2} /></div>

  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => setF((cur) => ({ ...cur, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    tap()
    setFormErr(null)
    setError(null)
    if (!f.title.trim() || !f.address.trim()) return setFormErr('required')
    if (!f.pay_amount || f.pay_amount < 1000) return setFormErr('payRequired')
    if (f.end_date < f.start_date) return setFormErr('endBeforeStart')
    const c = CITIES[f.city] ?? CITIES['Khác']
    const input: JobInput = {
      ...f, title: f.title.trim(), address: f.address.trim(), description: f.description.trim(), shift_note: f.shift_note.trim(),
      lat: f.lat ?? c.lat, lng: f.lng ?? c.lng, is_urgent: isPro && f.is_urgent,
    }
    if (!profile) { // the account is asked for only now, at the last step; the post is published as soon as it exists
      askAuth({ role: 'employer', prefill: { address: input.address, city: input.city }, onDone: (p) => { if (p.role === 'employer') void publish(input) } })
      return
    }
    await publish(input)
  }

  const publish = async (input: JobInput) => {
    setBusy(true)
    try {
      const j = await api.createJob(input)
      if (guide.trim()) await api.setJobGuide(j.id, guide).catch(() => undefined) // the post itself is already live
      clearPostDraft()
      setHeld(j.held_reason ?? null)
      setDone(true)
    } catch (err) {
      if (errorCode(err) === 'UNKNOWN') report(err, { where: 'createJob' })
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const limit = errorCode(error) === 'FREE_PLAN_LIMIT' || errorCode(error) === 'URGENT_REQUIRES_PRO'
  const preview: Job = {
    id: 'preview', employer_id: profile?.id ?? '', title: f.title || t('jobTitle'), description: f.description, category: f.category,
    pay_amount: f.pay_amount || 0, pay_unit: f.pay_unit, start_date: f.start_date, end_date: f.end_date, shift_note: f.shift_note,
    address: f.address, city: f.city, lat: null, lng: null, slots: f.slots, filled: 0, is_urgent: isPro && f.is_urgent, status: 'open',
    created_at: '', business_name: profile?.business_name || profile?.full_name || '',
  }

  const form = (
    <div className="stack">
      {draft && <div className="plan ok"><span><Ic n="sparkles" size={16} /> {t('capyDraftNote')}</span></div>}
      {prefilled && <div className="plan ok"><span><Ic n="sparkles" size={16} /> {t('prefilled')}</span></div>}
      <div className="formgrid">
        <div className="span"><Fld label={t('jobTitle')} htmlFor="p-title"><input id="p-title" className="inp" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={t('jobTitlePh')} maxLength={120} required /></Fld></div>
        <div className="span"><Fld label={t('category')}><div className="chiprow" style={{ flexWrap: 'wrap' }}>{CATS.map((c) => <Chip key={c} on={f.category === c} onClick={() => set('category', c)}>{t(`cat${c}` as TKey)}</Chip>)}</div></Fld></div>
        <Fld label={t('pay')} htmlFor="p-pay"><input id="p-pay" className="inp" type="number" inputMode="numeric" min={1000} step={1000} value={f.pay_amount || ''} onChange={(e) => set('pay_amount', Number(e.target.value))} required /></Fld>
        <Fld label={t('unit')} htmlFor="p-unit"><select id="p-unit" className="inp" value={f.pay_unit} onChange={(e) => set('pay_unit', e.target.value as PayUnit)}>{UNITS.map((u) => <option key={u} value={u}>{t(`u${u}` as TKey)}</option>)}</select></Fld>
        <Fld label={t('startDate')} htmlFor="p-start"><input id="p-start" className="inp" type="date" value={f.start_date} min={today()} onChange={(e) => set('start_date', e.target.value)} /></Fld>
        <Fld label={t('endDate')} htmlFor="p-end"><input id="p-end" className="inp" type="date" value={f.end_date} min={f.start_date} onChange={(e) => set('end_date', e.target.value)} /></Fld>
        <Fld label={t('shiftNote')} htmlFor="p-shift"><input id="p-shift" className="inp" value={f.shift_note} onChange={(e) => set('shift_note', e.target.value)} placeholder={t('shiftNotePh')} maxLength={80} /></Fld>
        <Fld label={t('slotsNeed')} htmlFor="p-slots"><input id="p-slots" className="inp" type="number" inputMode="numeric" min={1} max={200} value={f.slots || ''} onChange={(e) => set('slots', Math.max(1, Math.min(200, Number(e.target.value) || 1)))} /></Fld>
        <Fld label={t('address')} htmlFor="p-addr"><input id="p-addr" className="inp" value={f.address} onChange={(e) => setF((c) => ({ ...c, address: e.target.value, lat: null, lng: null }))} maxLength={200} required /></Fld>
        <Fld label={t('city')} htmlFor="p-city"><select id="p-city" className="inp" value={f.city} onChange={(e) => setF((c) => ({ ...c, city: e.target.value, lat: null, lng: null }))}>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}</select></Fld>
        <div className="span"><TasksField value={f.tasks ?? []} onChange={(v) => set('tasks', v)} category={f.category} /></div>
        <div className="span"><Fld label={t('guideLabel')} htmlFor="p-guide"><textarea id="p-guide" className="inp" value={guide} onChange={(e) => setGuide(e.target.value)} placeholder={t('guidePh')} maxLength={600} /></Fld></div>
        <div className="span"><Fld label={t('description')} htmlFor="p-desc"><textarea id="p-desc" className="inp" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder={t('descriptionPh')} maxLength={2000} /></Fld></div>
        <div className="span sw">
          <div><b>{t('urgentToggle')}</b> {cfg?.billing === 'on' && <Tag tone="sun">{t('proOnly')}</Tag>}{!isPro && cfg?.billing === 'on' && <div><button type="button" className="back" style={{ minHeight: 0, padding: 0, fontSize: 13 }} onClick={() => nav('/app/bang-gia')}>{t('upgrade')} →</button></div>}</div>
          <button type="button" className={'tog' + (isPro && f.is_urgent ? ' on' : '')} role="switch" aria-checked={isPro && f.is_urgent} disabled={!isPro} onClick={() => set('is_urgent', !f.is_urgent)} aria-label={t('urgentToggle')} />
        </div>
      </div>
      {formErr && <div className="notice error" role="alert">{t(formErr)}</div>}
      {error != null && (
        <div>
          <ErrorBox error={error} where="PostJob.submit" />
          {limit && cfg?.billing === 'on' && <Btn v="ghost" block className="mt8" onClick={() => nav('/app/bang-gia')}>{t('upgrade')}</Btn>}
        </div>
      )}
    </div>
  )
  const submitBtn = <Btn type="submit" block={bp === 'm'} style={bp === 't' || bp === 'l' ? { width: '100%', maxWidth: 360 } : bp === 'd' ? { minWidth: 200 } : undefined} disabled={busy}>{busy ? '…' : t('submitPost')}</Btn>

  return (
    <form className={bp === 'm' ? 'pcol' : 'page-scroll'} onSubmit={submit} noValidate>
      <div className="pg" style={{ flex: 1 }}>
        <div className="row" style={{ marginBottom: 16 }}>
          {bp === 'm' && <button type="button" className="back" aria-label={t('back')} onClick={() => nav('/app/tin-cua-toi')}>←</button>}
          <h1 className="ptitle">{t('postTitle')}</h1>
        </div>
        <div className="notice info small" style={{ marginBottom: 12 }}>{t('noFeePost')} <FeeNote /></div>
        {!profile && (
          <div className="plan ok" style={{ marginBottom: 12 }}>
            <span><Ic n="sparkles" size={16} /> {t('postGuestNote')}</span>
            <button type="button" className="back" style={{ minHeight: 0, padding: 0 }} onClick={() => askAuth({ role: 'employer' })}>{t('postHaveAccount')}</button>
          </div>
        )}
        {bp === 'd'
          ? <div className="formwrap"><div>{form}<div style={{ marginTop: 20 }}>{submitBtn}</div></div><div className="preview"><div className="sub" style={{ marginBottom: 8 }}><Ic n="eye" size={16} /> {t('whoSees')}</div><JobCard job={preview} onOpen={() => undefined} /></div></div>
          : <div>{form}{bp !== 'm' && <div style={{ marginTop: 20 }}>{submitBtn}</div>}</div>}
      </div>
      {bp === 'm' && <div className="cta">{submitBtn}</div>}
      {done && (
        <Dialog full label={t('postedTitle')} onClose={() => nav('/app/tin-cua-toi')}>
          <img className="capy hop" src={capy('cheer')} alt="" />
          <h2>{held ? t('jobHeldTitle') : t('postedTitle')}</h2>
          <div className="sub">{held ? t('jobHeldText', { reason: held }) : t('postedText')}</div>
          <Btn block onClick={() => nav('/app/tin-cua-toi')}>{t('backToMyJobs')}</Btn>
        </Dialog>
      )}
    </form>
  )
}
