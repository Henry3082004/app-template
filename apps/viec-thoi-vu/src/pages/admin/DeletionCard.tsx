import { useState } from 'react'
import { Btn, ErrorBox, Tag } from '../../components/ui'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import type { AdminDeletion } from '../../lib/types'

export function DeletionCard({ d, onDone }: { d: AdminDeletion; onDone(): void }) {
  const { t } = useI18n()
  const [err, setErr] = useState<unknown>(null)
  const resolve = async () => { try { await api.resolveDeletion(d.id, ''); onDone() } catch (e) { setErr(e) } }
  return (
    <article className="card stack">
      <div className="hrow"><b>{d.name}</b><Tag tone={d.status === 'open' ? 'urgent' : 'ok'}>{d.status === 'open' ? t('adminTabDeletions') : t('adminHandled')}</Tag></div>
      <div className="adminrows">
        {d.email && <div><span>Email</span><b>{d.email}</b></div>}
        <div><span>ID</span><b>{d.user_id}</b></div>
      </div>
      {d.reason && <div className="sub" style={{ fontSize: 14 }}>“{d.reason}”</div>}
      <div className="muted small">{new Date(d.requested_at).toLocaleString()}</div>
      {d.status === 'open' && <Btn sm onClick={resolve}>{t('adminResolve')}</Btn>}
      {err != null && <ErrorBox error={err} where="Admin.deletion" />}
    </article>
  )
}
