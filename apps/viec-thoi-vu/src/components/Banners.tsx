import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BANNERS } from '../lib/banners'
import { capy } from '../lib/capy'
import { useI18n } from '../lib/i18n'
import { Ic } from './Ic'

const EVERY_MS = 3000

/** Slides across the top of the job list: moves on by itself every 3 s, stops while touched/hovered, swipe or tap the dots to browse. */
export function Banners() {
  const { locale, t } = useI18n()
  const track = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(0)
  const [paused, setPaused] = useState(false)

  const go = useCallback((i: number) => {
    const el = track.current
    if (!el) return
    const n = (i + BANNERS.length) % BANNERS.length
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }, [])

  // keep the dots in step with swipes as well as automatic moves
  const onScroll = () => {
    const el = track.current
    if (el && el.clientWidth) setCur(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => { if (!document.hidden) go(cur + 1) }, EVERY_MS)
    return () => window.clearInterval(id)
  }, [paused, cur, go])

  return (
    <section
      className="banners"
      aria-roledescription="carousel"
      aria-label={t('bannersLabel')}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    >
      <div className="bn-track" ref={track} onScroll={onScroll}>
        {BANNERS.map((b, i) => {
          const c = b.copy[locale]
          return (
            <div key={b.id} className={`bn ${b.tone}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${BANNERS.length}`} aria-hidden={i !== cur}>
              <span className="bn-tag">{c.tag}</span>
              <b className="bn-title">{c.title}</b>
              <span className="bn-sub">{c.sub}</span>
              {b.to && c.cta && <Link className="bn-cta" to={b.to} tabIndex={i === cur ? 0 : -1}>{c.cta} <Ic n="arrow" size={14} /></Link>}
              <img src={capy(b.pose)} alt="" />
            </div>
          )
        })}
      </div>
      <button type="button" className="bn-arrow prev" aria-label={t('bannerPrev')} onClick={() => go(cur - 1)}><Ic n="chevL" size={18} /></button>
      <button type="button" className="bn-arrow next" aria-label={t('bannerNext')} onClick={() => go(cur + 1)}><Ic n="chevR" size={18} /></button>
      <div className="bn-dots">
        {BANNERS.map((b, i) => <button key={b.id} type="button" className={i === cur ? 'on' : ''} aria-label={`${i + 1} / ${BANNERS.length}`} aria-current={i === cur} onClick={() => go(i)}><i /></button>)}
      </div>
    </section>
  )
}
