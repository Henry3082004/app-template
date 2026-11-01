import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'
import { Ic } from '../../../components/Ic'
import type { TrustSignals } from '../../../lib/types'

/** Word-keeping facts for these people (no-shows of a worker; unpaid reports, cancels, reply time of a shop), loaded once per set of ids. */
export function useTrust(ids: string[]): Record<string, TrustSignals> {
  const [map, setMap] = useState<Record<string, TrustSignals>>({})
  const key = [...new Set(ids)].sort().join(',')
  useEffect(() => {
    if (key) api.trustSignals(key.split(',')).then(setMap).catch(() => undefined)
  }, [key])
  return map
}

/** One quiet line under a name: the verified phone, and only the things that are worth knowing (nothing when all is clean). */
export function TrustLine({ sig, shop }: { sig?: TrustSignals; shop?: boolean }) {
  const { t } = useI18n()
  if (!sig) return null
  const bad: string[] = []
  if (shop) {
    if (sig.unpaid > 0) bad.push(t('trustUnpaid', { n: sig.unpaid }))
    if (sig.cancels > 0) bad.push(t('trustCancels', { n: sig.cancels, m: sig.hires, late: sig.late_cancels }))
    if (sig.mismatch > 0) bad.push(t('trustMismatch', { n: sig.mismatch }))
  } else if (sig.noshow_30d > 0) bad.push(t('trustNoshow30', { n: sig.noshow_30d }))
  else if (sig.noshow_total > 0) bad.push(t('trustNoshowAll', { n: sig.noshow_total }))
  return (
    <div className="rep trust">
      <span className={'tag ' + (sig.phone_verified ? 'ok' : '')}>{sig.phone_verified && <Ic n="check" size={12} />} {sig.phone_verified ? t('trustVerified') : t('trustUnverified')}</span>
      {shop && sig.reply_hours != null && <span className="muted">{sig.reply_hours <= 1 ? t('trustReplyFast') : t('trustReply', { n: sig.reply_hours })}</span>}
      {bad.map((b) => <span key={b} className="warnt">{b}</span>)}
    </div>
  )
}
