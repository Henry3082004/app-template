import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { HireTabs } from '../components/HireTabs'
import { Ic } from '../components/Ic'
import { InviteDialog } from '../components/InviteDialog'
import { Avatar, Btn, Empty, ErrorBox, Skel } from '../components/ui'
import { api } from '../lib/api'
import { CITIES } from '../lib/geo'
import { useHires } from '../lib/hires'
import { useI18n, type TKey } from '../lib/i18n'
import { useSession } from '../lib/session'
import { AVAILABILITY, EXPERIENCE, type FoundWorker } from '../lib/types'
import { ageOf, avatarUrl } from '../lib/worker'

/** "Tìm người": workers who chose to be found. Shortened name and no phone — the phone is shared only when they accept a job. */
export default function FindWorkers() {
  const { t } = useI18n()
  const { profile, ready } = useSession()
  const { list } = useHires()
  const [city, setCity] = useState('')
  const [exp, setExp] = useState('')
  const [when, setWhen] = useState('')
  const [found, setFound] = useState<FoundWorker[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [inviting, setInviting] = useState<FoundWorker | null>(null)
  const [sent, setSent] = useState<{ job_id: string; worker_id: string }[]>([])
  const employer = profile?.role === 'employer'

  const load = () => {
    setError(null)
    api.searchWorkers({ city, exp, when }).then(setFound).catch((e) => { setFound([]); setError(e) })
  }
  useEffect(() => { if (employer) load() }, [employer, city, exp, when]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (employer) api.mySentInvites().then(setSent).catch(() => undefined) }, [employer])

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!employer) return <Navigate to="/app" replace />
  const pending = (list ?? []).filter((h) => h.status === 'pending' && h.job.status === 'open').length

  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle">{t('navHiring')}</h1>
      <HireTabs pending={pending} />
      <div className="notice info">{t('findPrivacy')}</div>
      <div className="row wrap" style={{ gap: 8 }}>
        <select className="inp" aria-label={t('city')} value={city} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">{t('findAnyCity')}</option>{Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="inp" aria-label={t('expLabel')} value={exp} onChange={(e) => setExp(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">{t('findAnyExp')}</option>{EXPERIENCE.filter((k) => k !== 'none').map((k) => <option key={k} value={k}>{t(`exp_${k}` as TKey)}</option>)}
        </select>
        <select className="inp" aria-label={t('availLabel')} value={when} onChange={(e) => setWhen(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">{t('findAnyTime')}</option>{AVAILABILITY.map((k) => <option key={k} value={k}>{t(`avail_${k}` as TKey)}</option>)}
        </select>
      </div>
      {error != null && <ErrorBox error={error} where="FindWorkers.load" onRetry={load} />}
      {!found && !error && <Skel n={2} />}
      {found && found.length === 0 && error == null && <Empty pose="empty" title={t('findEmpty')} sub={t('findEmptySub')} />}
      <div className="g2">
        {found?.map((w) => {
          const age = ageOf(w.birth_year)
          return (
            <div key={w.user_id} className="card cand">
              <div className="row">
                <Avatar name={w.name} src={avatarUrl(w.avatar_path)} size={52} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b>{w.name}</b>
                  <div className="sub" style={{ fontSize: 14 }}>{[age ? t('ageYears', { n: age }) : null, w.city].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div className="wfacts">
                {w.experience.map((k) => <span key={k} className="tag">{t(`exp_${k}` as TKey)}</span>)}
                {w.availability.length > 0 && <span className="muted"><Ic n="calendar" size={13} /> {w.availability.map((k) => t(`avail_${k}` as TKey)).join(' · ')}</span>}
              </div>
              <div className="row" style={{ gap: 10, fontSize: 14 }}>
                {w.avg_stars != null && w.ratings > 0 && <span className="stars-n"><Ic n="star" size={14} /> <b>{w.avg_stars.toFixed(1)}</b> <span className="muted">({t('repRatings', { n: w.ratings })})</span></span>}
                <span className="muted">{w.shifts_done > 0 ? t('shiftsN', { n: w.shifts_done }) : t('repNewWorker')}</span>
              </div>
              <div className="acts"><Btn onClick={() => setInviting(w)}>{t('inviteInApp')}</Btn></div>
            </div>
          )
        })}
      </div>
      {inviting && (
        <InviteDialog workerId={inviting.user_id} name={inviting.name} fresh invited={sent.filter((i) => i.worker_id === inviting.user_id).map((i) => i.job_id)}
          onInvited={(jobId) => setSent((cur) => [...cur, { job_id: jobId, worker_id: inviting.user_id }])} onClose={() => setInviting(null)} />
      )}
    </div></div>
  )
}
