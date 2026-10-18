import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useI18n, type TKey } from '../../lib/i18n'
import { Ic } from '../Ic'
import { Btn, Dialog, ErrorBox } from '../ui'
import type { Escrow, Role } from '../../lib/types'

/** "You still have N shifts to review" — shown on My applications / My posts. */
export function PendingReviews({ employer, refresh }: { employer?: boolean; refresh?: unknown }) {
  const { t } = useI18n()
  const [n, setN] = useState(0)
  useEffect(() => { api.pendingReviews().then(setN).catch(() => undefined) }, [refresh])
  if (!n) return null
  return <div className="notice warn pendrev"><Ic n="star" size={16} /> {t(employer ? 'pendingReviewsEmp' : 'pendingReviews', { n })}</div>
}

export function ReviewPrompt({ app, onReview }: { app: Escrow; onReview(): void }) {
  const { t } = useI18n()
  if (app.reviewed) return <div className="small muted">{t('reviewedDone')}</div>
  return (
    <div className="revprompt">
      <div className={app.other_reviewed ? 'notice info' : 'small muted'}>{t(app.other_reviewed ? 'otherReviewed' : 'reviewNudge')}</div>
      <Btn onClick={onReview}><Ic n="star" size={16} /> {t('reviewCta')}</Btn>
    </div>
  )
}

const TAGS: Record<Role, string[]> = {
  employer: ['hardworking', 'punctual', 'polite', 'fast_learner'],
  seeker: ['accurate_description', 'friendly', 'clean_safe', 'clear_instructions'],
}

/** `as` = the role of the person writing the review. */
export function ReviewDialog({ appId, as, onClose, onDone }: { appId: string; as: Role; onClose(): void; onDone(): void }) {
  const { t } = useI18n()
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const title = t(as === 'employer' ? 'reviewTitleEmp' : 'reviewTitleSeeker')
  const send = async () => {
    setBusy(true); setError(null)
    try { await api.submitReview(appId, stars, tags, comment); onDone() } catch (e) { setError(e); setBusy(false) }
  }
  return (
    <Dialog label={title} onClose={onClose}>
      <div className="stack">
        <h2>{title}</h2>
        <div className="starpick" role="radiogroup" aria-label={title}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}`} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}><Ic n="star" size={30} /></button>
          ))}
        </div>
        <div className="chiprow wrap">
          {TAGS[as].map((k) => {
            const on = tags.includes(k)
            return <button key={k} type="button" className={'chip' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setTags(on ? tags.filter((x) => x !== k) : [...tags, k])}>{t(`tag_${k}` as TKey)}</button>
          })}
        </div>
        <textarea className="inp" maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('reviewPh')} aria-label={t('reviewPh')} />
        <div className="small muted">{t('reviewHint')}</div>
        {error != null && <ErrorBox error={error} where="ReviewDialog" />}
        <Btn block onClick={send} disabled={busy || stars < 1}>{busy ? '…' : t('reviewSend')}</Btn>
        <Btn v="text" onClick={onClose}>{t('cancel')}</Btn>
      </div>
    </Dialog>
  )
}
