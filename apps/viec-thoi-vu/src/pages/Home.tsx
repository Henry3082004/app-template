import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { JobCard } from '../components/JobCard'
import { IncomeCard } from '../components/Wallet'
import { Btn, Skel } from '../components/ui'
import { api } from '../lib/api'
import { shiftsOf, summarize } from '../lib/earnings'
import { dateRange } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { fitScore, isFit, useQuizAnswers } from '../lib/quiz'
import { useSession } from '../lib/session'
import type { Job, Reputation } from '../lib/types'
import { useMine } from '../lib/useMine'

/** "Trang chủ" for a signed-in worker: hello, this month's income, shifts coming up, a few jobs for me. */
export default function Home() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, viewAsUser } = useSession()
  const { list } = useMine()
  const quiz = useQuizAnswers()
  const [jobs, setJobs] = useState<Job[] | null>(null)
  const [reps, setReps] = useState<Record<string, Reputation>>({})
  useEffect(() => {
    api.listOpenJobs().then((js) => {
      setJobs(js)
      api.reputations([...new Set(js.map((j) => j.employer_id))], 'employer').then(setReps).catch(() => undefined)
    }).catch(() => setJobs([]))
  }, [])

  const earn = useMemo(() => (list ? summarize(list) : null), [list])
  const shifts = useMemo(() => shiftsOf(list), [list])
  const next = shifts.filter((s) => s.when !== 'done').slice(0, 3)
  const mine = new Set((list ?? []).filter((a) => a.status === 'pending' || a.status === 'accepted').map((a) => a.job.id))
  const open = useMemo(() => (jobs ?? [])
    .filter((j) => !(viewAsUser && j.is_sample) && !mine.has(j.id))
    .sort((a, b) => fitScore(b, quiz) - fitScore(a, quiz) || Number(b.is_urgent) - Number(a.is_urgent) || b.created_at.localeCompare(a.created_at))
    .slice(0, 5), [jobs, list, quiz, viewAsUser]) // eslint-disable-line react-hooks/exhaustive-deps
  const pending = (list ?? []).filter((a) => a.status === 'pending').length

  return (
    <div className="page-scroll"><div className="pg homepg">
      <div className="hello"><span>{t('hello')}</span><b>{profile?.full_name}</b></div>
      <IncomeCard s={earn} />
      <div className="sumtiles">
        <div><b>{list ? shifts.filter((s) => s.when !== 'done').length : '–'}</b><span>{t('sumShifts')}</span></div>
        <div><b>{list ? pending : '–'}</b><span>{t('sumPending')}</span></div>
        <div><b>{jobs?.filter((j) => !(viewAsUser && j.is_sample)).length ?? '–'}</b><span>{t('sumOpen')}</span></div>
      </div>
      {next.length > 0 && (
        <section className="stack">
          <div className="sechead"><h2>{t('shiftsSoon')}</h2><Link to="/app/cham-cong">{t('seeAll')}</Link></div>
          {next.map((s) => (
            <button key={s.app.id} type="button" className="card minirow" onClick={() => nav(`/app/viec/${s.app.job.id}`)}>
              <b>{s.app.job.title}</b>
              <span className="muted small">{s.app.job.business_name} · {dateRange(s.app.job.start_date, s.app.job.end_date)}{s.when === 'today' ? ` · ${t('shiftOnToday')}` : ''}</span>
            </button>
          ))}
        </section>
      )}
      <section className="stack">
        <div className="sechead"><h2>{t('jobsForYou')}</h2><Link to="/app/viec-lam">{t('seeAll')}</Link></div>
        {!jobs && <Skel n={3} />}
        <div className="cards wide">
          {open.map((j) => <JobCard key={j.id} job={j} rep={reps[j.employer_id]} fit={isFit(j, quiz)} onOpen={() => nav(`/app/viec/${j.id}`)} />)}
        </div>
        {jobs && <Btn v="ghost" block onClick={() => nav('/app/viec-lam')}>{t('seeAllJobs')}</Btn>}
      </section>
    </div></div>
  )
}
