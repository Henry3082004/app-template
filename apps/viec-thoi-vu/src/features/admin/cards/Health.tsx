import { useState } from 'react'
import { Btn, Skel } from '../../../components/ui'
import { useI18n } from '../../../lib/i18n'
import { sendTestError } from '../../../lib/sentry'
import type { AdminStats } from '../../../lib/types'

export function HealthCard({ s }: { s: AdminStats | null }) {
  const { t } = useI18n()
  return (
    <section className="card stack" style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 17 }}>{t('healthTitle')}</h2>
      {!s ? <Skel n={1} /> : (
        <div className="tiles stats">
          <div><b>{s.employers}</b><span>{t('statEmployers')}</span></div>
          <div><b>{s.seekers}</b><span>{t('statSeekers')}</span></div>
          <div><b>{s.new_users_7d}</b><span>{t('statNewUsers', { n: s.new_users_today })}</span></div>
          <div><b>{s.open_jobs}</b><span>{t('statOpenJobs')}</span></div>
          <div><b>{s.applications_7d}</b><span>{t('statApps', { n: s.applications_today })}</span></div>
          <div><b>{s.shifts_done}</b><span>{t('statShiftsDone')}</span></div>
          <div><b>{s.reviews_total}</b><span>{t('statReviews')}</span></div>
          <div className={s.open_disputes > 0 ? 'bad' : ''}><b>{s.open_disputes}</b><span>{t('statDisputes')}</span></div>
        </div>
      )}
    </section>
  )
}

export function SentryCheck() {
  const { t } = useI18n()
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'off'>('idle')
  const send = async () => {
    setState('busy')
    setState((await sendTestError()) ? 'sent' : 'off')
  }
  return (
    <section className="card stack" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 17 }}>{t('sentryTestTitle')}</h2>
      <p className="small muted">{t('sentryTestHint')}</p>
      <div><Btn v="ghost" sm disabled={state === 'busy'} onClick={send}>{state === 'busy' ? '…' : t('sentryTestBtn')}</Btn></div>
      {state === 'sent' && <div className="notice ok">{t('sentryTestSent')}</div>}
      {state === 'off' && <div className="notice warn">{t('sentryTestOff')}</div>}
    </section>
  )
}
