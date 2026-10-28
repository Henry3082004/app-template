import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic, type IconName } from '../components/Ic'
import { Btn, Empty, ErrorBox, Skel } from '../components/ui'
import { api } from '../lib/api'
import { vnClock, vnDate, vnToday } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { AppNotification } from '../lib/types'

const ICON: Record<string, IconName> = {
  new_applicant: 'users', accepted: 'check', rejected: 'user', shift_done: 'clipboard', noshow: 'zap',
  cash_paid: 'wallet', cash_received: 'wallet', checked_in: 'pin', message: 'message', invite: 'briefcase',
}

/** "08:05" for today, "27/10" for older ones. */
function stamp(iso: string): string {
  return vnDate(iso) === vnToday() ? vnClock(iso) : `${vnDate(iso).slice(8)}/${vnDate(iso).slice(5, 7)}`
}

/** "Thông báo": what happened to my applications and shifts, newest first. Opening one marks it read and goes to the place it is about. */
export default function Notifications() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { profile, ready, askAuth } = useSession()
  const [list, setList] = useState<AppNotification[] | null>(null)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(() => {
    if (!profile) return
    setError(null)
    api.notifications().then(setList).catch(setError)
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load])

  const changed = () => window.dispatchEvent(new Event('vtv-notif'))
  const open = async (n: AppNotification) => {
    if (!n.read_at) { await api.markNotificationsRead([n.id]).catch(() => undefined); changed() }
    if (n.link) nav(n.link)
  }
  const readAll = async () => { await api.markNotificationsRead().catch(() => undefined); changed(); load() }

  if (!ready) return <div className="pg"><Skel n={2} /></div>
  if (!profile) {
    return (
      <div className="page-scroll"><div className="pg">
        <h1 className="ptitle">{t('notifTitle')}</h1>
        <Empty pose="wave" title={t('notifLogin')}><Btn onClick={() => askAuth({ role: 'seeker' })}>{t('login')}</Btn></Empty>
      </div></div>
    )
  }
  const unread = list?.filter((n) => !n.read_at).length ?? 0
  return (
    <div className="page-scroll"><div className="pg wide">
      <div className="hrow" style={{ alignItems: 'center' }}>
        <h1 className="ptitle">{t('notifTitle')}</h1>
        {unread > 0 && <Btn v="text" sm onClick={readAll}>{t('notifMarkAll')}</Btn>}
      </div>
      {error != null && <ErrorBox error={error} where="Notifications.load" onRetry={load} />}
      {!list && !error && <Skel n={3} />}
      {list && list.length === 0 && <Empty pose="empty" title={t('notifEmpty')} sub={t('notifEmptySub')} />}
      {list && list.length > 0 && (
        <div className="card notiflist">
          {list.map((n) => (
            <button key={n.id} type="button" className={'notif' + (n.read_at ? '' : ' unread')} onClick={() => open(n)}>
              <span className="nicon"><Ic n={ICON[n.kind] ?? 'bell'} size={18} /></span>
              <span className="ntext"><b>{n.title}</b>{n.body && <small>{n.body}</small>}</span>
              <span className="nwhen">{stamp(n.created_at)}</span>
            </button>
          ))}
        </div>
      )}
    </div></div>
  )
}
