import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { useAction } from '../lib/useAction'
import { ErrorBox } from './ui'

/** Worker's switch: "let shops find me" (off by default). Shops then see a shortened name, area, experience and reputation — never the phone. */
export function Discoverable() {
  const { t } = useI18n()
  const [on, setOn] = useState<boolean | null>(null)
  const { busy, error, setError, run } = useAction()
  useEffect(() => { api.myDiscoverable().then(setOn).catch(setError) }, [setError])
  const flip = () => { if (on != null) run('flip', async () => { await api.setDiscoverable(!on); setOn(!on) }) }
  return (
    <div className="stack">
      <div className="sw">
        <span id="disc-lab"><b>{t('discoverTitle')}</b></span>
        <button type="button" role="switch" aria-checked={!!on} aria-labelledby="disc-lab" className={'tog' + (on ? ' on' : '')} disabled={busy != null || on == null} onClick={flip} />
      </div>
      <div className="sub" style={{ fontSize: 14 }}>{t(on ? 'discoverOn' : 'discoverOff')}</div>
      {error != null && <ErrorBox error={error} where="Discoverable" />}
    </div>
  )
}
