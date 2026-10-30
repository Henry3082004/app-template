import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Ic } from '../../components/Ic'
import { api } from '../../lib/api'
import { runSearch } from '../../lib/capySearch'
import { useAppConfig } from '../../lib/config'
import { errorKey } from '../../lib/errors'
import { fmtKm } from '../../lib/geo'
import { dateRange } from '../../lib/format'
import { useI18n } from '../../lib/i18n'
import { readQuiz } from '../../lib/quiz'
import { useSession } from '../../lib/session'
import type { CapyDraft, CapyMsg, CapySearch, Job } from '../../lib/types'
import { Pay } from '../jobs/JobCard'
import { SaveButton } from '../jobs/SaveButton'
import { CapyBot } from './CapyBot'
import { CapyFigure } from './CapyFigure'

type Item = { role: 'user' | 'assistant'; text: string; search?: CapySearch; draft?: CapyDraft }

/** Capy, the AI helper: a chat bubble in the corner. Job seekers say what they look for and get matching jobs from the real list;
 *  shops say what they need and get a draft post to check and publish. Capy never posts or applies by itself. */
export function CapyChat() {
  const { t, locale } = useI18n()
  const cfg = useAppConfig()
  const { profile } = useSession()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const end = useRef<HTMLDivElement>(null)
  const employer = profile?.role === 'employer'
  const jobsQ = useQuery({ queryKey: ['openJobs'], queryFn: () => api.listOpenJobs(), enabled: open && !employer })

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [items, busy, open])
  useEffect(() => { if (!profile) return; setItems([]); setError(null) }, [profile?.id, profile?.role]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cfg?.ai_assistant !== 'on' || pathname.startsWith('/app/dang-tin') || pathname.startsWith('/app/quan-tri')) return null

  const send = async (raw?: string) => {
    const msg = (raw ?? text).trim()
    if (!msg || busy) return
    const next: Item[] = [...items, { role: 'user', text: msg }]
    setItems(next); setText(''); setBusy(true); setError(null)
    try {
      const history: CapyMsg[] = next.slice(-8).map((i) => ({ role: i.role, text: i.text }))
      const r = await api.capyChat(history, { device: readQuiz().device, city: profile?.city ?? undefined })
      setItems((cur) => [...cur, { role: 'assistant', text: r.reply, search: r.search, draft: r.draft }])
    } catch (e) { setError(e) } finally { setBusy(false) }
  }

  const openDraft = (draft: CapyDraft, reply: string) => { setOpen(false); nav('/app/dang-tin', { state: { capyDraft: draft, capyNote: reply } }) }
  const seeAll = (s: CapySearch) => { setOpen(false); nav('/app', { state: { capy: s } }) }

  const sugs = employer ? (['capySugEmployer1', 'capySugEmployer2'] as const) : (['capySugSeeker1', 'capySugSeeker2', 'capySugSeeker3'] as const)

  return (
    <>
      {!open && (
        <CapyBot onOpen={() => setOpen(true)} />
      )}
      {open && (
        <div className="capyscrim" onClick={() => setOpen(false)}>
          <section className="capypanel" role="dialog" aria-label={t('capyName')} onClick={(e) => e.stopPropagation()}>
            <header>
              <span className="capyav"><CapyFigure act={busy ? 'think' : undefined} /></span>
              <div><b>{t('capyName')}</b><small>{t('capyWho')}</small></div>
              <button type="button" className="capyx" onClick={() => setOpen(false)} aria-label={t('capyClose')}>×</button>
            </header>
            <div className="capylist" aria-live="polite">
              <div className="cbub bot">{t(employer ? 'capyHelloEmployer' : 'capyHelloSeeker')}</div>
              {items.length === 0 && <div className="capysugs">{sugs.map((k) => <button key={k} type="button" className="chip" onClick={() => void send(t(k))}>{t(k)}</button>)}</div>}
              {items.map((i, n) => (
                <div key={n} className={'cbub ' + (i.role === 'user' ? 'me' : 'bot')}>
                  {i.text}
                  {i.search && <SearchResult search={i.search} jobs={jobsQ.data} loading={jobsQ.isLoading} onOpen={(id) => { setOpen(false); nav(`/app/viec/${id}`) }} onAll={() => seeAll(i.search!)} />}
                  {i.draft && <DraftCard draft={i.draft} onOpen={() => openDraft(i.draft!, i.text)} locale={locale} />}
                </div>
              ))}
              {busy && <div className="cbub bot dim">{t('capyThinking')}</div>}
              {error != null && <div className="notice warn">{t(errorKey(error))}</div>}
              <div ref={end} />
            </div>
            <p className="capynote">{t('capyAiNote')}</p>
            <form className="capyform" onSubmit={(e) => { e.preventDefault(); void send() }}>
              <input className="inp" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('capyPh')} aria-label={t('capyPh')} maxLength={500} />
              <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()} aria-label={t('capySend')}><Ic n="arrow" size={18} /></button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

function SearchResult({ search, jobs, loading, onOpen, onAll }: { search: CapySearch; jobs: Job[] | undefined; loading: boolean; onOpen(id: string): void; onAll(): void }) {
  const { t, locale } = useI18n()
  if (loading || !jobs) return null
  const found = runSearch(jobs, search)
  if (found.length === 0) return <div className="capymuted">{t('capyNoMatch')}</div>
  return (
    <div className="capyres">
      <div className="capymuted">{t('capyFound', { n: found.length })}</div>
      {found.slice(0, 4).map(({ job, km }) => (
        <div key={job.id} className="capyjob">
          <button type="button" onClick={() => onOpen(job.id)}>
            <b>{job.title}</b>
            <Pay job={job} />
            <span className="capymuted">{[job.business_name, job.city, km != null ? fmtKm(km, locale) : ''].filter(Boolean).join(' · ')}</span>
          </button>
          <SaveButton jobId={job.id} />
        </div>
      ))}
      {found.length > 4 && <button type="button" className="btn btn-ghost sm" onClick={onAll}>{t('capySeeAll', { n: found.length })}</button>}
    </div>
  )
}

function DraftCard({ draft, onOpen, locale }: { draft: CapyDraft; onOpen(): void; locale: string }) {
  const { t } = useI18n()
  return (
    <div className="capydraft">
      <b>{draft.title}</b>
      <span>{draft.pay_amount ? `${draft.pay_amount.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-GB')}đ / ${t(`per${draft.pay_unit}` as never)}` : t('capyNoPay')} · {draft.slots} · {dateRange(draft.start_date, draft.end_date)}</span>
      {draft.description && <span className="capymuted">{draft.description}</span>}
      <button type="button" className="btn btn-primary sm" onClick={onOpen}>{t('capyOpenDraft')}</button>
    </div>
  )
}
