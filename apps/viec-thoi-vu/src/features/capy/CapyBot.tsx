import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../lib/i18n'
import { CapyFigure } from './CapyFigure'

const POS_KEY = 'vtv-capy-pos'
const HI_KEY = 'vtv-capy-hi'
const SIZE = 72
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
    }
    setLive({ x: clamp(d.ox + dx, W - SIZE), y: clamp(d.oy + dy, H - SIZE) })
  }
  const up = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || d.id !== e.pointerId || !d.moved || !live) return
    justDragged.current = true
    const p = { fx: (live.x) / Math.max(1, W - SIZE), fy: (live.y) / Math.max(1, H - SIZE) }
    setPos(p); setLive(null)
    try { localStorage.setItem(POS_KEY, JSON.stringify(p)) } catch { /* private mode: the place is kept until reload */ }
  }
  const click = () => {
    if (justDragged.current) { justDragged.current = false; return }
    onOpen()
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
        <CapyFigure />
      </button>
    </div>
  )
}
