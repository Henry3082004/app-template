import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildSlides } from '../lib/banners'
import { capy } from '../lib/capy'
import { useHighlights } from '../lib/highlights'
import { useI18n, type TKey } from '../lib/i18n'
import { useSession } from '../lib/session'
import { Ic } from './Ic'

const EVERY_MS = 3000

/** Follows the "reduce motion" setting of the device, also when it changes while the page is open. */
function useReducedMotion() {
  const [reduce, setReduce] = useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!m) return
    const on = () => setReduce(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return reduce
}
const SNAP = 0.2 // drag further than this share of the width (or flick fast) to change slide

/** Slides across the top of the job list. Moves on by itself every 3 s; drag it with a finger or the mouse, or tap the dots or arrows.
 *  It waits while you hold it, while a control has keyboard focus, when the tab is hidden, and for people who asked for less motion. Loops forever. */
export function Banners() {
  const { locale, t } = useI18n()
  const { profile } = useSession()
  const highlights = useHighlights()
  const slides = useMemo(() => buildSlides(highlights, locale, profile?.role, (c) => t(`cat${c}` as TKey)), [highlights, locale, profile?.role, t])
  const N = slides.length
  const track = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(0)
  const [drag, setDrag] = useState<number | null>(null)
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tick, setTick] = useState(0)
  const prev = useRef(cur)
  useEffect(() => { prev.current = cur }, [cur])
  const reduce = useReducedMotion()
  const running = N > 1 && !pressed && !focused && !reduce

  const go = useCallback((i: number) => setCur(((i % N) + N) % N), [N])
  useEffect(() => { if (cur >= N) setCur(0) }, [cur, N])

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => { if (document.hidden) setTick((x) => x + 1); else go(cur + 1) }, EVERY_MS)
    return () => window.clearTimeout(id)
  }, [running, cur, tick, go])

  // ── dragging (mouse and touch; vertical swipes still scroll the page because of touch-action: pan-y) ──
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const moved = useRef(false)
  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() }; moved.current = false; setPressed(true)
  }
  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (!moved.current && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) { moved.current = true; track.current?.setPointerCapture(e.pointerId) }
    if (moved.current) setDrag(dx)
  }
  const up = (e: React.PointerEvent) => {
    const s = start.current
    start.current = null; setPressed(false)
    if (!s || !moved.current) { setDrag(null); return }
    const dx = e.clientX - s.x, w = track.current?.clientWidth || 1
    const fast = Math.abs(dx) / Math.max(1, Date.now() - s.t) > 0.4 && Math.abs(dx) > 30
    setDrag(null)
    if (Math.abs(dx) > w * SNAP || fast) go(cur + (dx < 0 ? 1 : -1))
    window.setTimeout(() => { moved.current = false }, 0) // lets the click that follows a drag be ignored
  }
  const cancel = () => { start.current = null; moved.current = false; setPressed(false); setDrag(null) }

  const half = Math.floor(N / 2)
  const rel = (i: number, c: number) => ((i - c + N + half) % N) - half

  if (N === 0) return null
  return (
    <section
      className="banners"
      aria-roledescription="carousel"
      aria-label={t('bannersLabel')}
      aria-live={running ? 'off' : 'polite'}
      onFocus={(e) => { if ((e.target as HTMLElement).matches(':focus-visible')) setFocused(true) }}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(cur - 1); else if (e.key === 'ArrowRight') go(cur + 1) }}
    >
      <div
        className={'bn-track' + (drag != null ? ' dragging' : '')} ref={track}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
        onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation() } }}
      >
        {slides.map((s, i) => {
          const r = rel(i, cur), jump = Math.abs(r - rel(i, prev.current)) > 1
          const style: React.CSSProperties = {
            transform: `translateX(calc(${r * 100}% + ${drag ?? 0}px))`,
            transition: drag != null || jump ? 'none' : undefined,
            visibility: Math.abs(r) > 1 ? 'hidden' : undefined,
          }
          const here = i === cur
          return (
            <div
              key={s.id} className={`bn ${s.tone}`} style={style}
              role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${N}`} aria-hidden={!here}
            >
              <span className={'bn-tag' + (s.kind === 'stat' ? ' live' : '')}>{s.tag}</span>
              <b className="bn-title">{s.title}</b>
              <span className="bn-sub">{s.sub}</span>
              {s.cta && s.to && <Link className="bn-cta" to={s.to} tabIndex={here ? 0 : -1} draggable={false}>{s.cta} <Ic n="arrow" size={14} /></Link>}
              {s.cta && s.href && <a className="bn-cta" href={s.href} target="_blank" rel="noopener noreferrer" tabIndex={here ? 0 : -1} draggable={false}>{s.cta} <Ic n="arrow" size={14} /></a>}
              <span className="bn-capy"><img src={capy(s.pose)} alt="" draggable={false} /></span>
            </div>
          )
        })}
      </div>
      {N > 1 && (
        <>
          <button type="button" className="bn-arrow prev" aria-label={t('bannerPrev')} onClick={() => go(cur - 1)}><Ic n="chevL" size={18} /></button>
          <button type="button" className="bn-arrow next" aria-label={t('bannerNext')} onClick={() => go(cur + 1)}><Ic n="chevR" size={18} /></button>
          <div className="bn-dots">
            {slides.map((s, i) => (
              <button key={s.id} type="button" className={i === cur ? 'on' : ''} aria-label={`${i + 1} / ${N}`} aria-current={i === cur} onClick={() => go(i)}>
                <i>{i === cur && <b key={`${cur}:${running}`} style={{ animationPlayState: running ? 'running' : 'paused' }} />}</i>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
