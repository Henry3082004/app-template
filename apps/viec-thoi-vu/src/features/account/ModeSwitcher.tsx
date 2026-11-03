import { useState } from 'react'
import { api } from '../../lib/api'
import { ADMIN_MODES, currentMode, modeHome, type AdminMode } from '../../lib/adminMode'
import { useI18n, type TKey } from '../../lib/i18n'
import { useSession } from '../../lib/session'
import { Ic } from '../../components/Ic'
import { ErrorBox } from '../../components/ui'

const LABEL: Record<AdminMode, { t: TKey; s: TKey }> = {
  new: { t: 'modeNewT', s: 'modeNewS' }, employer: { t: 'modeEmpT', s: 'modeEmpS' }, seeker: { t: 'modeSeekT', s: 'modeSeekS' }, admin: { t: 'modeAdminT', s: 'modeAdminS' },
}

/**
 * Admin only (or while looking around as someone else): pick what the app shows — a brand-new visitor, a sample shop that has been
 * using the app for a while, a sample worker likewise, or the admin view. The page reloads in the new mode so nothing is left over.
 */
export function ModeSwitcher() {
  const { t } = useI18n()
  const { profile } = useSession()
  const [busy, setBusy] = useState<AdminMode | null>(null)
  const [error, setError] = useState<unknown>(null)
  if (!profile?.is_admin && !api.adminSessionSaved()) return null
  const now = currentMode(profile)
  const pick = async (m: AdminMode) => {
    if (m === now || busy) return
    setBusy(m); setError(null)
    try {
      await api.adminMode(m)
      window.location.assign(modeHome(m)) // a clean start: caches, dialogs and the guide begin from nothing
    } catch (e) { setError(e); setBusy(null) }
  }
  return (
    <section className="card devtools" aria-label={t('modeTitle')}>
      <b><Ic n="eye" size={18} /> {t('modeTitle')}</b>
      <div className="sub" style={{ fontSize: 14 }}>{t('modeSub')}</div>
      <div className="modelist" role="radiogroup" aria-label={t('modeTitle')}>
        {ADMIN_MODES.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={now === m} className={'modeopt' + (now === m ? ' on' : '')} disabled={!!busy} onClick={() => void pick(m)}>
            <span><b>{t(LABEL[m].t)}</b><small>{t(LABEL[m].s)}</small></span>
            {busy === m ? <span>…</span> : now === m ? <Ic n="check" size={18} /> : null}
          </button>
        ))}
      </div>
      {error != null && <ErrorBox error={error} where="ModeSwitcher" />}
    </section>
  )
}
