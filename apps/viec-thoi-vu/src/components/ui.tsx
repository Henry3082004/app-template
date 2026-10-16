import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { IS_DEMO } from '../lib/api'
import { capy, type CapyPose } from '../lib/capy'
import { errorKey, errorReport } from '../lib/errors'
import { initials } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { Ic } from './Ic'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { v?: 'primary' | 'ghost' | 'text' | 'danger'; block?: boolean; sm?: boolean }
export function Btn({ v = 'primary', block, sm, className = '', ...p }: BtnProps) {
  return <button type="button" className={`btn btn-${v}${block ? ' block' : ''}${sm ? ' sm' : ''} ${className}`} {...p} />
}

export function Chip({ on, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return <button type="button" className={'chip' + (on ? ' on' : '')} aria-pressed={!!on} {...p}>{children}</button>
}

export function Tag({ tone = '', children }: { tone?: '' | 'urgent' | 'ok' | 'p' | 'sun'; children: ReactNode }) {
  return <span className={'tag ' + tone}>{tone === 'urgent' && <Ic n="zap" size={13} />}{children}</span>
}

export function Avatar({ name }: { name: string }) {
  return <span className="avatar" aria-hidden="true">{initials(name)}</span>
}

export function Fld({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="fld">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="lab">{label}</span>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

/** Bottom sheet on phones, centred dialog from 600px. `full` = full-screen on phones (success screens). */
export function Dialog({ children, onClose, full, label }: { children: ReactNode; onClose?: () => void; full?: boolean; label: string }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', f)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', f); document.body.style.overflow = prev }
  }, [onClose])
  return (
    <div className="scrim" onClick={onClose}>
      <div className={'dlg' + (full ? ' full' : '')} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {children}
      </div>
    </div>
  )
}

export function Empty({ pose, em, title, sub, children }: { pose?: CapyPose; em?: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="empty fade-in">
      {pose ? <img className="capy" src={capy(pose)} alt="" /> : <div className="em">{em}</div>}
      <b>{title}</b>
      {sub && <div>{sub}</div>}
      {children}
    </div>
  )
}

export function Skel({ n = 4 }: { n?: number }) {
  return (
    <div className="cards" aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card stack" style={{ gap: 10 }}>
          <div className="skel" style={{ height: 18, width: '70%' }} />
          <div className="skel" style={{ height: 24, width: '40%' }} />
          <div className="skel" style={{ height: 22 }} />
          <div className="skel" style={{ height: 14, width: '30%' }} />
        </div>
      ))}
    </div>
  )
}

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
        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
          {onRetry && <Btn v="ghost" sm className="mt8" onClick={onRetry}>{t('retry')}</Btn>}
          {IS_DEMO && <Btn v="text" sm className="mt8" onClick={copy}>{copied ? t('copied') : t('copyForClaude')}</Btn>}
        </div>
      )}
    </div>
  )
}
