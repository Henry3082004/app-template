import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../lib/api'
import { vnClock } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { ChatMessage } from '../lib/types'
import { Btn, Dialog, ErrorBox } from './ui'

/** Chat of one accepted shift: only the shop and that worker. Refreshes every few seconds while it is open (no push yet). */
export function ChatDialog({ applicationId, name, onClose }: { applicationId: string; name: string; onClose(): void }) {
  const { t } = useI18n()
  const { profile } = useSession()
  const [list, setList] = useState<ChatMessage[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const end = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    api.messages(applicationId).then((m) => setList([...m].reverse())).catch(setError)
  }, [applicationId])
  useEffect(() => { load(); const timer = setInterval(load, 8000); return () => clearInterval(timer) }, [load])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [list?.length])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true); setError(null)
    try { await api.sendMessage(applicationId, text); setText(''); load() } catch (err) { setError(err) } finally { setBusy(false) }
  }
  return (
    <Dialog label={t('chatTitle', { name })} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{t('chatTitle', { name })}</h2>
      <div className="chat" aria-live="polite">
        {list && list.length === 0 && <div className="muted small center">{t('chatEmpty')}</div>}
        {list?.map((m) => (
          <div key={m.id} className={'bubble ' + (m.sender_id === profile?.id ? 'me' : 'them')}>
            <span>{m.body}</span><small>{vnClock(m.created_at)}</small>
          </div>
        ))}
        <div ref={end} />
      </div>
      {error != null && <ErrorBox error={error} where="ChatDialog" />}
      <form className="chatform" onSubmit={send}>
        <input className="inp" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('chatPh')} maxLength={1000} aria-label={t('chatPh')} />
        <Btn type="submit" disabled={busy || !text.trim()}>{t('chatSend')}</Btn>
      </form>
      <div className="muted small">{t('chatNote')}</div>
    </Dialog>
  )
}
