import type { ReactNode } from 'react'
import { Ic } from '../../components/Ic'
import { Avatar, Btn, Dialog } from '../../components/ui'
import { dateRange } from '../../lib/format'
import { useI18n, type TKey } from '../../lib/i18n'
import type { Applicant, Job, Reputation } from '../../lib/types'
import { ageOf, avatarUrl } from '../../lib/worker'

export type Cand = Applicant & { job?: Job }
export const MAX_COMPARE = 3

/** Pill checkbox on a candidate card: tick 2–3 people, then compare them side by side. */
export function PickCand({ on, disabled, onChange }: { on: boolean; disabled: boolean; onChange(): void }) {
  const { t } = useI18n()
  return (
    <label className="pick">
      <input type="checkbox" checked={on} disabled={disabled && !on} onChange={onChange} /> {t('comparePick')}
    </label>
  )
}

/** The bar above the list: "So sánh (n)" is enabled from 2 ticked people. */
export function CompareBar({ n, onOpen }: { n: number; onOpen(): void }) {
  const { t } = useI18n()
  return (
    <div className="savedbar">
      <Btn v="ghost" onClick={onOpen} disabled={n < 2}><Ic n="compare" size={16} /> {t('compareBtn', { n })}</Btn>
      <span className="muted small">{t('candCompareHint')}</span>
    </div>
  )
}

/** 2–3 candidates side by side: photo, rating, shifts, punctuality, strengths, age, experience, free time, note — the best value in each row is marked. */
export function CompareCands({ people, reps, busy, onDecide, onClose }: { people: Cand[]; reps: Record<string, Reputation>; busy: string | null; onDecide(p: Cand, d: 'accepted' | 'rejected'): void; onClose(): void }) {
  const { t } = useI18n()
  const pct = (r?: Reputation) => (r && r.shifts_done ? Math.round((r.on_time / r.shifts_done) * 100) : null)
  const best = (vals: (number | null)[]) => { const m = Math.max(...vals.map((v) => v ?? -1)); return m > 0 ? vals.map((v) => v === m) : vals.map(() => false) }
  const stars = best(people.map((p) => reps[p.seeker_id]?.avg_stars ?? null))
  const shifts = best(people.map((p) => reps[p.seeker_id]?.shifts_done ?? null))
  const onTime = best(people.map((p) => pct(reps[p.seeker_id])))
  const rows: { k: TKey; cell: (p: Cand, i: number) => ReactNode; hi?: boolean[] }[] = [
    { k: 'cmpRating', hi: stars, cell: (p) => { const r = reps[p.seeker_id]; return r && r.avg_stars != null ? <span className="cmpstar"><Ic n="star" size={16} /> <b>{r.avg_stars.toFixed(1)}</b> <span className="muted">({t('repRatings', { n: r.ratings })})</span></span> : <span className="muted">{t('repNewWorker')}</span> } },
    { k: 'cmpShiftsDone', hi: shifts, cell: (p) => reps[p.seeker_id]?.shifts_done ?? 0 },
    { k: 'cmpOnTime', hi: onTime, cell: (p) => { const v = pct(reps[p.seeker_id]); return v == null ? '—' : v + '%' } },
    { k: 'cmpLateNoshow', cell: (p) => { const r = reps[p.seeker_id]; return `${r?.late ?? 0} · ${r?.noshow ?? 0}` } },
    { k: 'cmpStrengths', cell: (p) => { const tags = reps[p.seeker_id]?.top_tags ?? []; return tags.length ? <div className="wfacts">{tags.map((x) => <span key={x} className="tag">{t(`tag_${x}` as TKey)}</span>)}</div> : '—' } },
    { k: 'cmpAge', cell: (p) => { const a = ageOf(p.birth_year); return a ? t('ageYears', { n: a }) : '—' } },
    { k: 'cmpExp', cell: (p) => p.experience.length ? <div className="wfacts">{p.experience.map((x) => <span key={x} className="tag">{t(`exp_${x}` as TKey)}</span>)}</div> : '—' },
    { k: 'cmpAvail', cell: (p) => p.availability.length ? p.availability.map((x) => t(`avail_${x}` as TKey)).join(' · ') : '—' },
    { k: 'cmpApplied', cell: (p) => p.job ? <>{p.job.title}<div className="muted small">{dateRange(p.job.start_date, p.job.end_date)}</div></> : '—' },
    { k: 'cmpMessage', cell: (p) => p.message ? `“${p.message}”` : '—' },
  ]
  return (
    <Dialog full wide label={t('candCompareTitle')} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{t('candCompareTitle')}</h2>
      <div className="cmpwrap">
        <table className="cmp cmpc">
          <thead>
            <tr><th />{people.map((p) => (
              <th key={p.id} scope="col">
                <div className="cmphead"><Avatar name={p.full_name} src={avatarUrl(p.avatar_path)} size={72} /><b>{p.full_name}</b></div>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k}><th scope="row">{t(r.k)}</th>{people.map((p, i) => <td key={p.id} className={r.hi?.[i] ? 'best' : ''}>{r.cell(p, i)}</td>)}</tr>
            ))}
            <tr><th scope="row" />{people.map((p) => (
              <td key={p.id}>
                {p.status === 'pending'
                  ? <div className="cmpacts"><Btn v="ghost" sm disabled={busy === p.id} onClick={() => onDecide(p, 'rejected')}>{t('reject')}</Btn><Btn sm disabled={busy === p.id} onClick={() => onDecide(p, 'accepted')}>{t('accept')}</Btn></div>
                  : <span className="tag">{t(`st${p.status}` as TKey)}</span>}
              </td>
            ))}</tr>
          </tbody>
        </table>
      </div>
      <Btn block onClick={onClose}>{t('done')}</Btn>
    </Dialog>
  )
}
