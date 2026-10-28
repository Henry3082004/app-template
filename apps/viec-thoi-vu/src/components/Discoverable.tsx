import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { ErrorBox } from './ui'

/** Worker's switch: "let shops find me" (off by default). Shops then see a shortened name, area, experience and reputation — never the phone. */
export function Discoverable() {
  const { t } = useI18n()
  const [on, setOn] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => { api.myDiscoverable().then(setOn).catch(setError) }, [])
  const flip = async () => {
    if (on == null) return
    setBusy(true); setError(null)
    try { await api.setDiscoverable(!on); setOn(!on) } catch (e) { setError(e) } finally { setBusy(false) }
  }
  return (
    <div className="stack">
      <div className="sw">
        <span id="disc-lab"><b>{t('discoverTitle')}</b></span>
        <button type="button" role="switch" aria-checked={!!on} aria-labelledby="disc-lab" className={'tog' + (on ? ' on' : '')} disabled={busy || on == null} onClick={flip} />
      </div>
      <div className="sub" style={{ fontSize: 14 }}>{t(on ? 'discoverOn' : 'discoverOff')}</div>
      {error != null && <ErrorBox error={error} where="Discoverable" />}
    </div>
  )
}
