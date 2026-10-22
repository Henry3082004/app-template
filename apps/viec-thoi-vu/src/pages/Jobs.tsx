import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Ic } from '../components/Ic'
import { Banners } from '../components/Banners'
import { JobCard } from '../components/JobCard'
import { LegalLinks } from '../components/LegalLinks'
import { Btn, Chip, Dialog, Empty, ErrorBox, Skel } from '../components/ui'
import { api } from '../lib/api'
import { capy } from '../lib/capy'
import { km, locate, type Coords } from '../lib/geo'
import { useI18n, type TKey } from '../lib/i18n'
import { fitScore, isFit, useQuizAnswers } from '../lib/quiz'
import { useSession } from '../lib/session'
import type { AppStatus, Category, Job, PayUnit, Reputation } from '../lib/types'
import { useBp } from '../lib/useBp'
import { JobDetail } from './JobDetail'

type Filter = 'all' | 'urgent' | Category
const FILTERS: { id: Filter; key: TKey }[] = [
  { id: 'all', key: 'fAll' }, { id: 'urgent', key: 'fUrgent' }, { id: 'service', key: 'catservice' },
  { id: 'warehouse', key: 'catwarehouse' }, { id: 'event', key: 'catevent' }, { id: 'farm', key: 'catfarm' }, { id: 'retail', key: 'catretail' },
]
const PAY_OPTS: { v: string; label: string }[] = [
  { v: '', label: '' }, { v: 'hour:25000', label: '25.000đ / giờ' }, { v: 'hour:35000', label: '35.000đ / giờ' }, { v: 'day:300000', label: '300.000đ / ngày' },
]
const AREAS = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương']

let cachedCoords: Coords | null = null
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export default function Jobs() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const bp = useBp()
  const desk = bp === 'l' || bp === 'd' // landscape tablet / desktop: menu on the left, greeting card, jobs as rows
  const big = bp === 'd' // wide enough to keep the open job in a sticky card next to the list
  const { profile, ready, askAuth, viewAsUser } = useSession()
  const [params, setParams] = useSearchParams()
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [reps, setReps] = useState<Record<string, Reputation>>({})
  const [error, setError] = useState<unknown>(null)
  const [mine, setMine] = useState<Record<string, AppStatus>>({})
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [area, setArea] = useState('')
  const [minPay, setMinPay] = useState('')
  const [coords, setCoords] = useState<Coords | null>(cachedCoords)
  const [loc, setLoc] = useState<'idle' | 'busy' | 'denied'>('idle')
  const [done, setDone] = useState(false)
  const [single, setSingle] = useState<Job | null | undefined>(undefined)
  const searchRef = useRef<HTMLInputElement>(null)
  const quiz = useQuizAnswers()

  const load = useCallback(() => {
    setError(null)
    setJobs(null)
    api.listOpenJobs().then((js) => {
      setJobs(js)
      api.reputations([...new Set(js.map((j) => j.employer_id))], 'employer').then(setReps).catch(() => undefined)
    }).catch(setError)
  }, [])
  useEffect(load, [load])

  const loadMine = useCallback(() => {
    if (profile?.role === 'seeker') api.myApplicationStatus().then(setMine).catch(() => undefined)
    else setMine({})
  }, [profile])
  useEffect(loadMine, [loadMine])

  // "/" focuses search on desktop
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  // Landing "Đăng tin tuyển" lands here with ?tuyen=1 → open employer sign-up straight away.
  useEffect(() => {
    if (ready && params.has('tuyen')) {
      setParams({}, { replace: true })
      if (!profile) askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })
    }
  }, [ready, params]) // eslint-disable-line react-hooks/exhaustive-deps

  // A job opened directly by link may not be in the open list (closed / full).
  useEffect(() => {
    setSingle(undefined)
    if (id && jobs && !jobs.some((j) => j.id === id)) api.getJob(id).then(setSingle).catch(() => setSingle(null))
  }, [id, jobs])

  const findMe = async () => {
    setLoc('busy')
    const c = await locate()
    cachedCoords = c
    setCoords(c)
    setLoc(c ? 'idle' : 'denied')
  }

  const distOf = useCallback((j: Job) => (coords && j.lat != null && j.lng != null ? km(coords, { lat: j.lat, lng: j.lng }) : null), [coords])

  const shown = useMemo(() => {
    if (!jobs) return []
    const needle = strip(q.trim())
    const [mu, ma] = minPay ? minPay.split(':') : ['', '']
    const list = jobs.filter((j) =>
      !(viewAsUser && j.is_sample) && // admins see the sample jobs; the normal view does not
      (filter === 'all' || (filter === 'urgent' ? j.is_urgent : j.category === filter)) &&
      (!area || j.city === area) &&
      (!minPay || (j.pay_unit === (mu as PayUnit) && j.pay_amount >= Number(ma))) &&
      (!needle || strip(`${j.title} ${j.business_name ?? ''} ${j.city} ${j.address}`).includes(needle)))
    return list
      .map((j) => ({ j, d: distOf(j) }))
      .sort((a, b) => (coords
        ? (a.d ?? 1e9) - (b.d ?? 1e9)
        : fitScore(b.j, quiz) - fitScore(a.j, quiz) || Number(b.j.is_urgent) - Number(a.j.is_urgent) || b.j.created_at.localeCompare(a.j.created_at)))
  }, [jobs, q, filter, area, minPay, coords, distOf, quiz, viewAsUser])

  // businesses live on "My posts"; one that can also work may still open a shared job link (and switch to apply)
  if (profile?.role === 'employer' && !(id && profile.roles.includes('seeker'))) return <Navigate to="/app/tin-cua-toi" replace />

  const selected = id ? (jobs?.find((j) => j.id === id) ?? single ?? null) : null
  const open = (jid: string) => nav(`/app/viec/${jid}`)
  const clear = () => { setFilter('all'); setQ(''); setArea(''); setMinPay('') }

  const detail = selected && (
    <JobDetail
      job={selected}
      distance={distOf(selected)}
      mine={mine[selected.id] ?? null}
      onBack={big ? undefined : () => nav('/app/viec-lam')}
      onApplied={() => { setDone(true); loadMine(); load() }}
    />
  )

  const successDialog = done && (
    <Dialog full label={t('appliedTitle')} onClose={() => setDone(false)}>
      <img className="capy hop" src={capy('cheer')} alt="" />
      <h2>{t('appliedTitle')}</h2>
      <div className="sub">{t('appliedText')}</div>
      <Btn block onClick={() => { setDone(false); nav('/app/viec-lam') }}>{t('moreJobs')}</Btn>
      <Btn v="text" onClick={() => { setDone(false); nav('/app/da-ung-tuyen') }}>{t('seeApplied')}</Btn>
    </Dialog>
  )

  // Phone / portrait tablet with a job open → the job page on its own.
  if (!big && id) {
    return (
      <>
        <div className="pcol">
          {selected ? detail
            : jobs === null || single === undefined ? <div className="pg"><Skel n={2} /></div>
            : <div className="pg"><Empty pose="empty" title={t('notFound')}><Btn v="ghost" sm onClick={() => nav('/app/viec-lam')}>{t('backJobs')}</Btn></Empty></div>}
        </div>
        {successDialog}
      </>
    )
  }

  const sortLine = (
    <div className="sortline">
      {jobs && <span>{t('capyFound', { n: shown.length })}</span>}
      {coords
        ? <span>{t('nearYou')}</span>
        : <button type="button" className="back" style={{ minHeight: 0, padding: 0, fontSize: 14 }} onClick={findMe} disabled={loc === 'busy'}>{loc === 'busy' ? t('locating') : <><Ic n="pin" size={14} /> {t('useLocation')}</>}</button>}
    </div>
  )
  const chips = FILTERS.map((f) => <Chip key={f.id} on={filter === f.id} onClick={() => setFilter(f.id)}>{f.id === 'urgent' && <Ic n="zap" size={14} />}{t(f.key)}</Chip>)

  const body = error != null
    ? <ErrorBox error={error} where="Jobs.list" onRetry={load} />
    : jobs === null
      ? <><div className="center" style={{ marginBottom: 12 }}><img className="capy sm" src={capy('bath')} alt="" style={{ margin: '0 auto' }} /><div className="sub">{t('capyLoading')}</div></div><Skel n={big ? 4 : 3} /></>
      : shown.length === 0
        ? <Empty pose="empty" title={t('emptyTitle')} sub={t('emptySub')}><Btn v="ghost" sm onClick={clear}>{t('clearFilters')}</Btn></Empty>
        : <div className={'cards' + (desk ? ' wide' : '')}>{shown.map(({ j, d }) => <JobCard key={j.id} job={j} distance={d} rep={reps[j.employer_id]} fit={isFit(j, quiz)} sel={big && j.id === id} onOpen={() => open(j.id)} />)}</div>

  const selects = (
    <>
      <label className="sel"><span>{t('area')}</span>
        <select id="f-area" className="inp" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">{t('allAreas')}</option>{AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>
      <label className="sel"><span>{t('minPay')}</span>
        <select id="f-pay" className="inp" value={minPay} onChange={(e) => setMinPay(e.target.value)}>
          {PAY_OPTS.map((o) => <option key={o.v} value={o.v}>{o.label || t('noLimit')}</option>)}
        </select>
      </label>
    </>
  )

  // One page at every size: banner, a search card floating over its lower edge, then the jobs.
  // Desktop (≥1280px) also keeps the open job in a sticky card next to the list.
  return (
    <>
      <div className="jobspage">
        <div className="jwrap">
          {desk && !profile && (
            <section className="card hellocard">
              <div className="hello"><span>{t('hello')}</span><b>{t('helloGuest')}</b></div>
              <div className="sub">{t('sumGuest')}</div>
              <div className="acts"><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('signIn')}</Btn></div>
            </section>
          )}
          <Banners />
          <section className="searchcard" role="search">
            <div className="srow">
              <div className="searchbox">
                <span className="si"><Ic n="search" size={18} /></span>
                <input ref={searchRef} className="inp" type="search" placeholder={t('searchPh')} aria-label={t('searchPh')} value={q} onChange={(e) => setQ(e.target.value)} />
                <span className="kbd" aria-hidden="true">/</span>
              </div>
              {selects}
            </div>
            <div className="chiprow">{chips}</div>
          </section>
          <div className="jbody">
            <section className="jlist">
              <div className="jhead">
                <h1 className="ptitle">{t(desk ? 'jobsForYou' : 'navJobs')}</h1>
                {!desk && !profile && <Btn v="ghost" sm onClick={() => askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })}>{t('iNeedStaff')}</Btn>}
                {sortLine}
              </div>
              {loc === 'denied' && <div className="notice warn">{t('locDenied')}</div>}
              {body}
              <LegalLinks />
            </section>
            {big && (
              <aside className="jdetail" aria-label={t('about')}>
                {selected ? detail : <Empty pose="wave" title={t('pickJob')} sub={t('pickJobSub')} />}
              </aside>
            )}
          </div>
        </div>
      </div>
      {successDialog}
    </>
  )
}
