import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PendingReviews, SeekerPay } from '../components/Escrow'
import { Ic } from '../components/Ic'
import { Pay } from '../components/JobCard'
import { Btn, Empty, ErrorBox, Skel, Tag } from '../components/ui'
import { api } from '../lib/api'
import { dateRange } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { displayPhone, telHref, zaloHref } from '../lib/phone'
import { useSession } from '../lib/session'
import type { AppStatus, MyApplication } from '../lib/types'

const TONE: Record<AppStatus, '' | 'ok' | 'p'> = { pending: 'p', accepted: 'ok', rejected: '', withdrawn: '' }

export default function MyApplications() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready, askAuth } = useSession()
  const [list, setList] = useState<MyApplication[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [actErr, setActErr] = useState<unknown>(null)

  const load = () => {
    if (profile?.role !== 'seeker') return
    setError(null)
    api.sweep().catch(() => undefined).then(() => api.myApplications()).then(setList).catch(setError)
  }
  useEffect(load, [profile])

  const withdraw = async (id: string) => {
    if (!confirm(t('withdrawConfirm'))) return
    setActErr(null)
    try { await api.withdraw(id); load() } catch (e) { setActErr(e) }
  }

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile) {
    return (
      <div className="page-scroll"><div className="pg">
        <h1 className="ptitle">{t('appliedTitlePage')}</h1>
        <Empty pose="wave" title={t('loginToSee')}><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</Btn></Empty>
      </div></div>
    )
  }

  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('appliedTitlePage')}</h1>
      <PendingReviews refresh={list} />
      {error != null && <ErrorBox error={error} where="MyApplications.load" onRetry={load} />}
      {actErr != null && <div style={{ marginBottom: 12 }}><ErrorBox error={actErr} where="MyApplications.withdraw" /></div>}
      {!list && !error && <Skel n={2} />}
      {list && list.length === 0 && <Empty pose="empty" title={t('emptyApplied')}><Btn onClick={() => nav('/app')}>{t('findJobs')}</Btn></Empty>}
      <div className="g2">
        {list?.map((a) => (
          <article className="card stack" key={a.id}>
            <div className="hrow">
              <h3 style={{ fontSize: 17, cursor: 'pointer' }} onClick={() => nav(`/app/viec/${a.job.id}`)}>{a.job.title}</h3>
              <Tag tone={TONE[a.status]}>{t(`st${a.status}`)}</Tag>
            </div>
            <Pay job={a.job} />
            <div className="biz"><Ic n="store" size={15} /> {a.job.business_name} · <Ic n="calendar" size={15} /> {dateRange(a.job.start_date, a.job.end_date)}</div>
            {a.status === 'accepted' && <SeekerPay app={a} onChanged={load} />}
            {a.status === 'accepted' && a.employer_phone && (
              <>
                <div className="phone"><Ic n="phone" size={20} /> {displayPhone(a.employer_phone)}</div>
                <div className="row" style={{ gap: 10 }}>
                  <a className="btn btn-primary sm" href={telHref(a.employer_phone)}>{<Ic n="phone" size={16} />} {t('call')}</a>
                  <a className="btn btn-ghost sm" href={zaloHref(a.employer_phone)} target="_blank" rel="noreferrer">{<Ic n="message" size={16} />} {t('zalo')}</a>
                </div>
              </>
            )}
            {a.status === 'pending' && <div><Btn v="text" sm onClick={() => withdraw(a.id)}>{t('withdraw')}</Btn></div>}
          </article>
        ))}
      </div>
    </div></div>
  )
}
