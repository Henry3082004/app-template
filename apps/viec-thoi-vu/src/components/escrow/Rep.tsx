import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useI18n, type TKey } from '../../lib/i18n'
import { repLevel } from '../../lib/reputation'
import { Ic } from '../Ic'
import type { ReceivedReview, Reputation } from '../../lib/types'

/**
 * Reputation — the app's core signal. Three sizes:
 *  sm: one line on job cards · md: applicant cards & job detail · lg: Account page with stat tiles.
 */
export function Rep({ rep, employer, size = 'md' }: { rep?: Reputation; employer?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useI18n()
  const lvl = repLevel(rep)
  const cls = { new: 'tag p', good: 'tag ok', ok: 'tag', warn: 'tag warn' }[lvl]
  const label = { new: employer ? t('repNewShop') : t('repNewWorker'), good: t('repGood'), ok: t('repOk'), warn: t('repWarn') }[lvl]
  const done = rep?.shifts_done ?? 0
  const onTimePct = done ? Math.round(((rep?.on_time ?? 0) / done) * 100) : null
  const stars = rep && rep.ratings > 0 && rep.avg_stars != null
    ? <span className="stars-n"><Ic n="star" size={size === 'lg' ? 22 : 14} /> <b>{rep.avg_stars.toFixed(1)}</b> <span className="muted">({t('repRatings', { n: rep.ratings })})</span></span>
    : null

  if (size === 'sm') {
    return (
      <div className="rep sm">
        {stars}
        {done > 0 ? <span className="muted">{t('repShifts', { n: done })}</span> : <span className="muted">{label}</span>}
        {(lvl === 'good' || lvl === 'warn') && <span className={cls}>{label}</span>}
      </div>
    )
  }
  if (size === 'lg') {
    return (
      <div className="replg">
        <div className="rephead"><span className={cls}>{label}</span>{stars}</div>
        <div className="tiles">
          <div><b>{done}</b><span>{t('repStatShifts')}</span></div>
          <div><b>{onTimePct == null ? '—' : onTimePct + '%'}</b><span>{t('repStatOnTime')}</span></div>
          <div><b>{rep?.partners ?? 0}</b><span>{t('repStatPartners')}</span></div>
          {!employer && <div className={rep && rep.noshow > 0 ? 'bad' : ''}><b>{rep?.noshow ?? 0}</b><span>{t('repStatNoshow')}</span></div>}
        </div>
        {onTimePct != null && <div className="meter" aria-hidden="true"><span style={{ width: onTimePct + '%' }} /></div>}
        <div className="small muted">{t('repWhy')}</div>
      </div>
    )
  }
  return (
    <div className="rep">
      <span className={cls}>{label}</span>
      {stars}
      <span className="muted">{done === 0 ? (employer ? t('repEmployerNew') : t('repNoShifts')) : t('repShifts', { n: done })}</span>
      {onTimePct != null && <span className="muted">{t('repOnTime', { n: onTimePct })}</span>}
      {rep && rep.partners > 1 && <span className="muted">{t('repPartners', { n: rep.partners })}</span>}
      {!employer && rep && rep.noshow > 0 && <span className="warnt">{t('repNoshow', { n: rep.noshow })}</span>}
    </div>
  )
}

/** Account page card: my own reputation + reviews others left about me. */
export function OwnReputation({ userId, employer }: { userId: string; employer: boolean }) {
  const { t, locale } = useI18n()
  const [rep, setRep] = useState<Reputation>()
  const [reviews, setReviews] = useState<ReceivedReview[]>([])
  useEffect(() => {
    const side = employer ? 'employer' : 'seeker'
    api.reputations([userId], side).then((m) => setRep(m[userId])).catch(() => undefined)
    // reviews about me on this side were written by the other side
    api.receivedReviews().then((rs) => setReviews(rs.filter((r) => r.reviewer_role !== side))).catch(() => undefined)
  }, [userId, employer])
  return (
    <div className="card stack">
      <b>{t('repTitle')}</b>
      <Rep rep={rep} employer={employer} size="lg" />
      {rep && rep.top_tags.length > 0 && <div className="chiprow wrap">{rep.top_tags.map((k) => <span key={k} className="tag">{t(`tag_${k}` as TKey)}</span>)}</div>}
      <b style={{ fontSize: 15 }}>{t('myReviewsTitle')}</b>
      {reviews.length === 0 && <div className="sub" style={{ fontSize: 14 }}>{t('noReviewsYet')}</div>}
      {reviews.map((r) => (
        <div key={r.id} className="revitem">
          <div className="stars-n">{Array.from({ length: r.stars }, (_, i) => <Ic key={i} n="star" size={14} />)} <span className="muted small">{new Date(r.created_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-GB')}</span></div>
          {r.tags.length > 0 && <div className="chiprow wrap">{r.tags.map((k) => <span key={k} className="tag">{t(`tag_${k}` as TKey)}</span>)}</div>}
          {r.comment && <div>“{r.comment}”</div>}
        </div>
      ))}
    </div>
  )
}
