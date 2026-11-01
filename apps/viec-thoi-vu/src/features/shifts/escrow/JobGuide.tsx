import { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { useI18n } from '../../../lib/i18n'

/** What the shop wants the worker to know (what to wear, who to ask for): readable only by the shop and the accepted worker. */
export function JobGuide({ jobId }: { jobId: string }) {
  const { t } = useI18n()
  const [text, setText] = useState<string | null>(null)
  useEffect(() => { api.jobGuide(jobId).then(setText).catch(() => undefined) }, [jobId])
  if (!text) return null
  return <div className="notice info stack"><b>{t('guideTitle')}</b><div style={{ whiteSpace: 'pre-line' }}>{text}</div></div>
}
