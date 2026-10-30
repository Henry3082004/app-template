import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { CapyFigure, type CapyAct } from './CapyFigure'

const POS_KEY = 'vtv-capy-pos'
const HI_KEY = 'vtv-capy-hi'
const SIZE = 72
const SLEEP_AFTER = 30_000 // no touch for this long: Capy dozes off until the next touch
const EDGE = 8

type Pos = { fx: number; fy: number } // place on screen as fractions of the free width / height, so it survives rotation and resizing

function readPos(): Pos | null {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) ?? 'null') as Pos | null
    return p && typeof p.fx === 'number' && typeof p.fy === 'number' ? p : null
  } catch { return null }
}

/** First visit in this browser tab: Capy flies in from the bottom-right corner, waves and says hello. */
function firstHello(): boolean {
  try {
    if (sessionStorage.getItem(HI_KEY)) return false
    sessionStorage.setItem(HI_KEY, '1')
    return true
  } catch { return false }
}

const clamp = (v: number, max: number) => Math.min(Math.max(v, EDGE), Math.max(EDGE, max - EDGE))

/** Capy as a little character in the corner instead of a plain button: it can be dragged anywhere with a finger or the mouse,
 *  remembers where it was left, and a tap opens the chat. */
export function CapyBot({ onOpen }: { onOpen: () => void }) {
  const { t } = useI18n()
  const [pos, setPos] = useState<Pos | null>(readPos)
  const [hello] = useState(firstHello)
  const [bubble, setBubble] = useState(hello)
  const [, setTick] = useState(0)
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)
  const [live, setLive] = useState<{ x: number; y: number } | null>(null)
  // what Capy is doing: hello on the first visit, then a short wave every few seconds; drag, drop, tap and dozing play over it
  const [act, setAct] = useState<CapyAct>(hello ? 'hello' : 'wave')
  const actTimer = useRef(0)
  const play = (a: CapyAct, ms = 0) => {
    window.clearTimeout(actTimer.current)
    setAct(a)
    if (ms) actTimer.current = window.setTimeout(() => setAct('wave'), ms)
  }

  useEffect(() => {
    if (hello) actTimer.current = window.setTimeout(() => setAct('wave'), 4100)
    return () => window.clearTimeout(actTimer.current)
  }, [hello])
  useEffect(() => {
    let id = 0
    const awake = () => {
      window.clearTimeout(id)
      setAct((a) => (a === 'sleepy' ? 'wave' : a))
      id = window.setTimeout(() => setAct((a) => (a === 'wave' ? 'sleepy' : a)), SLEEP_AFTER)
    }
    awake()
    const opts = { passive: true }
    window.addEventListener('pointerdown', awake, opts); window.addEventListener('scroll', awake, opts); window.addEventListener('keydown', awake)
    return () => { window.clearTimeout(id); window.removeEventListener('pointerdown', awake); window.removeEventListener('scroll', awake); window.removeEventListener('keydown', awake) }
  }, [])

  useEffect(() => {
    if (!bubble) return
    const id = window.setTimeout(() => setBubble(false), 7000)
    return () => window.clearTimeout(id)
  }, [bubble])
  useEffect(() => {
    const re = () => setTick((n) => n + 1)
    window.addEventListener('resize', re)
    return () => window.removeEventListener('resize', re)
  }, [])

  const W = window.innerWidth, H = window.innerHeight
  const xy = live ?? (pos ? { x: clamp(pos.fx * (W - SIZE), W - SIZE), y: clamp(pos.fy * (H - SIZE), H - SIZE) } : null)
  const style = xy ? { left: xy.x, top: xy.y, right: 'auto', bottom: 'auto' } : undefined
  const onLeft = xy ? xy.x + SIZE / 2 < W / 2 : false

  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false }
  }
  const move = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 6) return
      d.moved = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setBubble(false)
      play('dragged')
    }
    setLive({ x: clamp(d.ox + dx, W - SIZE), y: clamp(d.oy + dy, H - SIZE) })
  }
  const up = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId || !d.moved) return
    if (!live) { play('wave'); return }
    justDragged.current = true
    play('drop', 1500)
    const p = { fx: (live.x) / Math.max(1, W - SIZE), fy: (live.y) / Math.max(1, H - SIZE) }
    setPos(p); setLive(null)
    try { localStorage.setItem(POS_KEY, JSON.stringify(p)) } catch { /* private mode: the place is kept until reload */ }
  }
  const click = () => {
    if (justDragged.current) { justDragged.current = false; return }
    play('tap', 800)
    window.setTimeout(onOpen, 280) // let the little start show before the chat covers it
  }

  return (
    <div className={'capybot' + (hello ? ' hi' : '') + (live ? ' dragging' : '') + (onLeft ? ' onleft' : '')} style={style}>
      {bubble && (
        <button type="button" className="capysay" onClick={onOpen}>
          {t('capyGreet')}
        </button>
      )}
      <button type="button" className="capyme" aria-label={t('capyFab')}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={click}>
        <CapyFigure act={act} />
      </button>
    </div>
  )
}
