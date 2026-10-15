import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CardSkeleton } from '../components/Skeleton'
import { ErrorBox } from '../components/ErrorBox'
import { JobCard } from '../components/JobCard'
import { api } from '../lib/api'
import { km, locate, type Coords } from '../lib/geo'
import { useI18n, type TKey } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { Category, Job } from '../lib/types'

type Filter = 'all' | 'urgent' | Category
const FILTERS: { id: Filter; key: TKey }[] = [
  { id: 'all', key: 'fAll' }, { id: 'urgent', key: 'fUrgent' }, { id: 'service', key: 'catservice' },
  { id: 'warehouse', key: 'catwarehouse' }, { id: 'event', key: 'catevent' }, { id: 'farm', key: 'catfarm' }, { id: 'retail', key: 'catretail' },
]

let cachedCoords: Coords | null = null
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

export default function Jobs() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready, askAuth } = useSession()
  const [params, setParams] = useSearchParams()
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [coords, setCoords] = useState<Coords | null>(cachedCoords)
  const [loc, setLoc] = useState<'idle' | 'busy' | 'denied'>('idle')

  const load = () => {
    setError(null)
    setJobs(null)
    api.listOpenJobs().then(setJobs).catch(setError)
  }
  useEffect(load, [])

  const findMe = async () => {
    setLoc('busy')
    const c = await locate()
    cachedCoords = c
    setCoords(c)
    setLoc(c ? 'idle' : 'denied')
  }

  const shown = useMemo(() => {
    if (!jobs) return []
    const needle = strip(q.trim())
    const list = jobs.filter((j) =>
      (filter === 'all' || (filter === 'urgent' ? j.is_urgent : j.category === filter)) &&
      (!needle || strip(`${j.title} ${j.business_name ?? ''} ${j.city} ${j.address}`).includes(needle)))
    const dist = (j: Job) => (coords && j.lat != null && j.lng != null ? km(coords, { lat: j.lat, lng: j.lng }) : null)
    return list
      .map((j) => ({ j, d: dist(j) }))
      .sort((a, b) => (coords
        ? (a.d ?? 1e9) - (b.d ?? 1e9)
        : Number(b.j.is_urgent) - Number(a.j.is_urgent) || b.j.created_at.localeCompare(a.j.created_at)))
  }, [jobs, q, filter, coords])


  // Landing "Đăng tin tuyển" lands here with ?tuyen=1 → open the employer sign-up straight away.
  useEffect(() => {
    if (ready && params.has('tuyen')) {
      setParams({}, { replace: true })
      if (!profile) hire()
    }
  }, [ready, params]) // eslint-disable-line react-hooks/exhaustive-deps

  const hire = () => askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })

  if (profile?.role === 'employer') return <Navigate to="/app/tin-cua-toi" replace />

  return (
    <div className="page-enter">
      <header className="topbar">
        <div className="row">
          <div className="logo">VT</div>
          <h1>{t('jobsTitle')}</h1>
        </div>
        {!profile && <button className="btn secondary small" onClick={hire}>{t('iNeedStaff')}</button>}
      </header>

      <div className="search">
        <span>🔎</span>
        <input className="input" type="search" placeholder={t('searchPh')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('searchPh')} />
      </div>

      <div className="filters" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'filter on' : 'filter'} onClick={() => setFilter(f.id)}>
            {t(f.key)}
          </button>
        ))}
      </div>

      {!coords && (
        <div className="row between" style={{ margin: '-4px 0 12px' }}>
          <button className="btn ghost small" onClick={findMe} disabled={loc === 'busy'} style={{ paddingLeft: 0 }}>
            {loc === 'busy' ? t('locating') : t('useLocation')}
          </button>
        </div>
      )}
      {coords && <p className="muted small" style={{ margin: '-4px 0 12px' }}>📍 {t('nearYou')}</p>}
      {loc === 'denied' && <div className="notice warn" style={{ marginBottom: 12 }}>{t('locDenied')}</div>}

      {error != null && <ErrorBox error={error} where="Jobs.list" onRetry={load} />}
      {!jobs && !error && <CardSkeleton />}
      {jobs && shown.length === 0 && (
        <div className="empty"><div className="big">🧺</div>{t('emptyJobs')}</div>
      )}
      {shown.map(({ j, d }) => (
        <JobCard key={j.id} job={j} distance={d} onOpen={() => nav(`/app/viec/${j.id}`)} />
      ))}
    </div>
  )
}
