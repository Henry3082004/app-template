import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { qk } from '../../lib/query'
import { useSession } from '../../lib/session'
import { useAction } from '../../lib/useAction'
import { ErrorBox } from '../../components/ui'

/** Worker's switch: "let shops find me" (off by default). Shops then see a shortened name, area, experience and reputation — never the phone. */
export function Discoverable() {
  const { t } = useI18n()
  const { profile } = useSession()
  const client = useQueryClient()
  const key = qk.discoverable(profile?.id)
  const q = useQuery({ queryKey: key, queryFn: () => api.myDiscoverable() })
  const on = q.data ?? null
  const { busy, error, run } = useAction()
  const flip = () => { if (on != null) run('flip', async () => { await api.setDiscoverable(!on); client.setQueryData(key, !on) }) }
  return (
    <div className="stack">
      <div className="sw">
        <span id="disc-lab"><b>{t('discoverTitle')}</b></span>
        <button type="button" role="switch" aria-checked={!!on} aria-labelledby="disc-lab" className={'tog' + (on ? ' on' : '')} disabled={busy != null || on == null} onClick={flip} />
      </div>
      <div className="sub" style={{ fontSize: 14 }}>{t(on ? 'discoverOn' : 'discoverOff')}</div>
      {(error ?? q.error) != null && <ErrorBox error={error ?? q.error} where="Discoverable" />}
    </div>
  )
}
