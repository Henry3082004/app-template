import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { capy } from '../lib/capy'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { questionsFor, useQuizAnswers } from '../lib/quiz'
import { useSession } from '../lib/session'
import { markTourSeen, tourHome, tourSeen, tourSteps, type TourRole } from '../lib/tour'
import { Btn } from './ui'

interface Box { x: number; y: number; w: number; h: number }

/** The first visible element for a selector (the menu exists twice, side and bottom, and only one of them is on screen). */
function findVisible(sel: string): HTMLElement | null {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}

/**
 * A short guide on the real screen, shown once per phone the first time someone is on their home page and nothing else is open
 * (the quick questions and the sign-in come first): the page dims, one element is lit and Capi says what it is for.
 * Skippable at any time; Account has "Show the guide again".
 */
export function TourHost() {
  const { pathname } = useLocation()
  const { profile, ready, authRequest, pending, introRequest, quizRequest } = useSession()
  const answers = useQuizAnswers()
  const role: TourRole = profile?.role === 'employer' ? 'employer' : 'seeker'
  const [active, setActive] = useState<TourRole | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const f = () => setTick((n) => n + 1)
    window.addEventListener('vtv-tour-reset', f)
    return () => window.removeEventListener('vtv-tour-reset', f)
  }, [])

  // wait for the quick questions, sign-in and other dialogs to finish, then start once
  const blocked = !ready || !!authRequest || !!pending || !!introRequest || !!quizRequest || questionsFor(answers).length > 0
  const here = pathname.replace(/\/+$/, '') === tourHome(role)
  useEffect(() => {
    if (active || blocked || !here || tourSeen(role)) return
    const timer = window.setInterval(() => {
      // .scrim = dialogs, .capyscrim = the Capi chat panel (it has its own class, so it must be listed too)
      if (!document.querySelector('.scrim, .capyscrim')) { window.clearInterval(timer); setActive(role) }
    }, 700)
    return () => window.clearInterval(timer)
  }, [active, blocked, here, role, tick])

  if (!active) return null
  return <TourRun role={active} signedIn={!!profile} onEnd={() => { markTourSeen(active); setActive(null) }} />
}

function TourRun({ role, signedIn, onEnd }: { role: TourRole; signedIn: boolean; onEnd(): void }) {
  const { t } = useI18n()
  const steps = tourSteps(role, signedIn)
  const [i, setI] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = steps[i]
  const last = i === steps.length - 1

  // find the element (the list may still be loading), bring it into view, and follow it while the page moves
  useEffect(() => {
    setBox(null)
    let tries = 0, found: HTMLElement | null = null
    const measure = () => {
      if (!found || !document.contains(found)) found = findVisible(step.target)
      if (!found) { if (++tries > 20) setBox(null); return }
      const r = found.getBoundingClientRect()
      if (tries === 0 || r.top < 0 || r.bottom > window.innerHeight) found.scrollIntoView({ block: 'center', behavior: 'auto' })
      tries = 1
      const r2 = found.getBoundingClientRect()
      setBox((b) => (b && Math.abs(b.x - r2.left) < 1 && Math.abs(b.y - r2.top) < 1 && Math.abs(b.w - r2.width) < 1 && Math.abs(b.h - r2.height) < 1 ? b : { x: r2.left, y: r2.top, w: r2.width, h: r2.height }))
    }
    measure()
    const timer = window.setInterval(measure, 200)
    return () => window.clearInterval(timer)
  }, [step.target])

  useEffect(() => { nextRef.current?.focus() }, [i])
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onEnd() }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onEnd])

  const pad = 6
  const H = window.innerHeight
  const lower = box ? box.y + box.h / 2 > H / 2 : false // the lit element is in the lower half: the card goes on top
  const go = (n: number) => { tap(); setI(n) }
  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label={t('tourLabel')}>
      <div className="tourblock" onClick={(e) => e.stopPropagation()} />
      {box ? <div className="tourhole" style={{ left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 }} /> : <div className="tourdim" />}
      <div className={'tourcard ' + (!box ? 'mid' : lower ? 'top' : 'bottom')}>
        <img src={capy(last ? 'cheer' : 'wave')} alt="" />
        <div className="tourtxt">
          <b>{t(step.title)}</b>
          <span>{t(step.text)}</span>
        </div>
        <div className="tourfoot">
          <div className="tourdots" aria-label={`${i + 1} / ${steps.length}`}>{steps.map((_, n) => <i key={n} className={n === i ? 'on' : ''} />)}</div>
          <div className="touracts">
            {!last && <button type="button" className="tourskip" onClick={onEnd}>{t('tourSkip')}</button>}
            {i > 0 && <Btn v="ghost" sm onClick={() => go(i - 1)}>{t('back')}</Btn>}
            <button ref={nextRef} type="button" className="btn btn-primary sm" onClick={() => (last ? onEnd() : go(i + 1))}>{last ? t('tourDone') : t('tourNext')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
