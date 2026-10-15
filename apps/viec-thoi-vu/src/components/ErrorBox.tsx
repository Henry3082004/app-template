import { useState } from 'react'
import { IS_DEMO } from '../lib/api'
import { errorKey, errorReport } from '../lib/errors'
import { useI18n } from '../lib/i18n'

export function ErrorBox({ error, where, onRetry }: { error: unknown; where: string; onRetry?: () => void }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(errorReport(error, where)); setCopied(true) } catch { /* clipboard blocked */ }
  }
  return (
    <div className="notice error" role="alert">
      {t(errorKey(error))}
      {(onRetry || IS_DEMO) && (
        <div className="row wrap" style={{ gap: 4 }}>
          {onRetry && <button className="btn secondary small mt-8" onClick={onRetry}>{t('retry')}</button>}
          {IS_DEMO && <button className="btn ghost small mt-8" onClick={copy}>{copied ? t('copied') : t('copyForClaude')}</button>}
        </div>
      )}
    </div>
  )
}
