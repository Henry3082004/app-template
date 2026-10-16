import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Applicants } from './Applicants'
import { Ic } from '../components/Ic'
import { Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { api } from '../lib/api'
import { dateRange } from '../lib/format'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { MyJob } from '../lib/types'
import { useBp } from '../lib/useBp'

export default function EmployerJobs() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { id } = useParams()
  const bp = useBp()
  const wide = bp !== 'm'
  const { profile, ready } = useSession()
  const [list, setList] = useState<MyJob[] | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(() => {
    if (profile?.role !== 'employer') return
    setError(null)
    api.myJobs().then(setList).catch(setError)
  }, [profile])
  useEffect(load, [load])

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (profile?.role !== 'employer') return <Navigate to="/app" replace />

  const open = list?.filter((j) => j.status === 'open').length ?? 0
  const isPro = profile.plan === 'pro'
  const post = id ? list?.find((j) => j.id === id) : undefined
  const post_ = () => { tap(); nav('/app/dang-tin') }

  if (!wide && id) {
    return post
      ? <Applicants job={post} onBack={() => nav('/app/tin-cua-toi')} onChanged={load} />
      : <div className="pg">{list ? <Empty pose="empty" title={t('notFound')} /> : <Skel n={2} />}</div>
  }

  const listing = (
    <>
      <div className="hrow" style={{ alignItems: 'center', marginBottom: 12 }}>
        <h1 className="ptitle">{t('myJobsTitle')}</h1>
        {wide && <Btn sm onClick={post_}>{t('postJob')}</Btn>}
      </div>
      <div className="plan" style={{ marginBottom: 12 }}>
        <span>{isPro ? t('proBar') : t('planBar', { open })}</span>
        {!isPro && <Link to="/app/bang-gia">{t('upgrade')}</Link>}
      </div>
      {error != null && <ErrorBox error={error} where="EmployerJobs.load" onRetry={load} />}
      {!list && !error && <Skel n={2} />}
      {list && list.length === 0 && <Empty pose="empty" title={t('emptyMyJobs')} />}
      <div className="cards">
        {list?.map((j) => (
          <button key={j.id} type="button" className={'card job' + (wide && j.id === id ? ' sel' : '')} onClick={() => nav(`/app/tin/${j.id}`)}>
            <div className="hrow"><h3>{j.title}</h3>{j.status === 'closed' ? <Tag>{t('closed')}</Tag> : j.is_urgent ? <Tag tone="urgent">{t('urgent')}</Tag> : null}</div>
            <div className="tags">
              <Tag><Ic n="calendar" size={14} /> {dateRange(j.start_date, j.end_date)}</Tag>
              <Tag><Ic n="users" size={14} /> {t('filledOf', { filled: j.filled, slots: j.slots })}</Tag>
              {j.newApplicants > 0 ? <Tag tone="p">{t('newApplicants', { n: j.newApplicants })}</Tag> : <Tag>{t('applicantsN', { n: j.applicants })}</Tag>}
            </div>
          </button>
        ))}
      </div>
    </>
  )

  if (!wide) {
    return (
      <div className="pcol">
        <div className="pg" style={{ flex: 1 }}>{listing}</div>
        <div className="cta">
          <div style={{ position: 'relative' }}>
            {list && list.length === 0 && <div className="coach" style={{ bottom: 60, left: 0 }}>{t('firstTip')}</div>}
            <Btn block onClick={post_}>{t('postJob')}</Btn>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="split two">
      <section className="listcol" style={{ position: 'relative' }}>
        {list && list.length === 0 && <div className="coach" style={{ top: 62, left: 150 }}>{t('firstTip')}</div>}
        {listing}
      </section>
      <section className="detailcol">
        {post ? <Applicants job={post} onChanged={load} /> : <Empty pose="wave" title={t('pickPost')} sub={t('pickPostSub')} />}
      </section>
    </div>
  )
}
