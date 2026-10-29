import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../../components/Ic'
import { Btn, Dialog, Empty, ErrorBox, Skel, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { errorCode } from '../../lib/errors'
import { dateRange } from '../../lib/format'
import { useI18n, type TKey } from '../../lib/i18n'
import { useSaved } from '../../lib/saved'
import { useSession } from '../../lib/session'
import type { Job, Profile, Reputation } from '../../lib/types'
import { useAction } from '../../lib/useAction'
import { Rep } from '../shifts/escrow'
import { Pay } from './JobCard'

const isOpen = (j: Job | null | undefined): boolean => !!j && j.status === 'open' && j.slots - j.filled > 0

/** "Việc đã lưu": the jobs a worker kept, side-by-side comparison of 2–3 of them, and one button to apply to all of them. */
export default function Saved() {
  const { t } = useI18n()
  const nav = useNavigate()
  const client = useQueryClient()
  const { profile, askAuth } = useSession()
  const saved = useSaved()
  const ids = saved.ids
  const jobsQ = useQuery({ queryKey: ['savedJobs', ids.join(',')], queryFn: () => api.jobsByIds(ids), enabled: ids.length > 0 })
  const statusQ = useQuery({ queryKey: ['myStatus', profile?.id], queryFn: () => api.myApplicationStatus(), enabled: !!profile })
  const [picked, setPicked] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<{ sent: number; skipped: number; failed: number } | null>(null)
  const act = useAction()

  const byId = new Map((jobsQ.data ?? []).map((j) => [j.id, j]))
  const mine = statusQ.data ?? {}
  const rows = ids.map((id) => ({ id, job: byId.get(id) ?? null }))
  const toApply = rows.filter((r) => isOpen(r.job) && !mine[r.id]).length
  const chosen = picked.filter((id) => byId.has(id))

  const applyAll = () => {
    setResult(null)
    const run = (p: Profile) => act.run('all', async () => {
      const status = await api.myApplicationStatus()
      let sent = 0, skipped = 0, failed = 0
      for (const id of ids) {
        if (!isOpen(byId.get(id)) || status[id] || !p.roles.includes('seeker')) { skipped++; continue }
        try { await api.apply(id, ''); sent++ } catch (e) { if (errorCode(e) === 'ALREADY_APPLIED' || errorCode(e) === 'JOB_NOT_OPEN' || errorCode(e) === 'JOB_FULL') skipped++; else failed++ }
      }
      setResult({ sent, skipped, failed })
      await Promise.all([statusQ.refetch(), client.invalidateQueries({ queryKey: ['mine'] })])
    })
    if (!profile) return askAuth({ role: 'seeker', onDone: (p) => { if (p.role === 'seeker') void run(p) } })
    void run(profile)
  }
  const pick = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id]))

  return (
    <div className="page-scroll"><div className="pg wide">
      <h1 className="ptitle" style={{ marginBottom: 16 }}>{t('savedTitle')}</h1>
      {!profile && ids.length > 0 && <div className="notice info">{t('savedGuestNote')}</div>}
      {!saved.ready && <Skel n={2} />}
      {saved.ready && ids.length === 0 && <Empty pose="empty" title={t('savedEmpty')} sub={t('savedEmptySub')}><Btn onClick={() => nav('/app')}>{t('findJobs')}</Btn></Empty>}
      {ids.length > 0 && (
        <div className="savedbar">
          <Btn onClick={applyAll} disabled={act.busy != null || toApply === 0}>{act.busy ? '…' : t('applyAll', { n: toApply })}</Btn>
          <Btn v="ghost" onClick={() => setComparing(true)} disabled={chosen.length < 2}><Ic n="compare" size={16} /> {t('compareBtn', { n: chosen.length })}</Btn>
          <span className="muted small">{t('compareHint')}</span>
        </div>
      )}
      {result && (
        <div className="notice ok stack">
          <span>{t('applyAllSent', { n: result.sent })}</span>
          {result.skipped > 0 && <span>{t('applyAllSkipped', { n: result.skipped })}</span>}
          {result.failed > 0 && <span>{t('applyAllFailed', { n: result.failed })}</span>}
        </div>
      )}
      {act.error != null && <ErrorBox error={act.error} where="Saved.applyAll" />}
      {jobsQ.error != null && <ErrorBox error={jobsQ.error} where="Saved.load" onRetry={() => void jobsQ.refetch()} />}
      {ids.length > 0 && jobsQ.isLoading && <Skel n={2} />}
      {jobsQ.data && (
        <div className="g2">
          {rows.map(({ id, job }) => {
            const st = mine[id]
            return (
              <article key={id} className={'card stack savedrow' + (chosen.includes(id) ? ' picked' : '')}>
                {job ? (
                  <>
                    <div className="hrow">
                      <h3 style={{ fontSize: 17, cursor: 'pointer' }} onClick={() => nav(`/app/viec/${id}`)}>{job.title}</h3>
                      {st ? <Tag tone={st === 'accepted' ? 'ok' : ''}>{t(`st${st}` as TKey)}</Tag> : !isOpen(job) && <Tag>{t(job.status === 'open' ? 'full' : 'jobClosed')}</Tag>}
                    </div>
                    <Pay job={job} />
                    <div className="biz"><Ic n="store" size={15} /> {job.business_name} · {job.city} · <Ic n="calendar" size={15} /> {dateRange(job.start_date, job.end_date)}</div>
                  </>
                ) : <div className="hrow"><b className="muted">{t('jobClosed')}</b></div>}
                <div className="acts">
                  {job && (
                    <label className="pick">
                      <input type="checkbox" checked={chosen.includes(id)} disabled={!chosen.includes(id) && chosen.length >= 3} onChange={() => pick(id)} /> {t('comparePick')}
                    </label>
                  )}
                  {job && <Btn v="ghost" sm onClick={() => nav(`/app/viec/${id}`)}>{t('openJob')}</Btn>}
                  <Btn v="text" sm onClick={() => { setPicked((cur) => cur.filter((x) => x !== id)); void saved.toggle(id) }}>{t('unsaveJob')}</Btn>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {comparing && <Compare jobs={chosen.map((id) => byId.get(id)!).filter(Boolean)} onClose={() => setComparing(false)} />}
    </div></div>
  )
}

/** 2–3 saved jobs side by side: pay, dates, hours, place, the shop's reputation, places left. */
function Compare({ jobs, onClose }: { jobs: Job[]; onClose(): void }) {
  const { t } = useI18n()
  const repsQ = useQuery({ queryKey: ['cmpReps', jobs.map((j) => j.employer_id).join(',')], queryFn: () => api.reputations([...new Set(jobs.map((j) => j.employer_id))], 'employer') })
  const reps: Record<string, Reputation> = repsQ.data ?? {}
  const rows: [TKey, (j: Job) => React.ReactNode][] = [
    ['cmpPay', (j) => <Pay job={j} />],
    ['cmpDates', (j) => dateRange(j.start_date, j.end_date)],
    ['cmpShift', (j) => j.shift_note || '—'],
    ['cmpPlace', (j) => [j.address, j.city].filter(Boolean).join(', ')],
    ['cmpShop', (j) => <><b>{j.business_name}</b><Rep rep={reps[j.employer_id]} employer size="sm" /></>],
    ['cmpSlots', (j) => Math.max(0, j.slots - j.filled)],
    ['cmpUrgent', (j) => t(j.is_urgent ? 'yes' : 'no')],
  ]
  return (
    <Dialog full label={t('compareTitle')} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{t('compareTitle')}</h2>
      <div className="cmpwrap">
        <table className="cmp">
          <thead><tr><th />{jobs.map((j) => <th key={j.id} scope="col">{j.title}</th>)}</tr></thead>
          <tbody>{rows.map(([k, cell]) => <tr key={k}><th scope="row">{t(k)}</th>{jobs.map((j) => <td key={j.id}>{cell(j)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <Btn block onClick={onClose}>{t('done')}</Btn>
    </Dialog>
  )
}
