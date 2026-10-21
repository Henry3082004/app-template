import { useEffect, useState } from 'react'
import type { CapyPose } from './capy'
import { AVAILABILITY, EXPERIENCE, type Availability, type Category, type Experience, type Job, type Role } from './types'

/**
 * "Capy hỏi nhanh" — a few tap-only questions the first time someone opens the app. Answers suggest matching jobs
 * and pre-fill the worker profile. Each question is asked once; a question added later is asked on its own.
 * Adding a question = add it here AND to private.clean_quiz (supabase/migrations/20261027_quick_quiz.sql).
 */
export const QUIZ_CATS = ['service', 'warehouse', 'event', 'farm', 'retail', 'any'] as const
export type QuizCat = (typeof QUIZ_CATS)[number]
export const QUIZ_CITIES = ['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương', 'other'] as const

/** null = skipped (never asked again) · missing = not asked yet */
export interface QuizAnswers {
  goal?: Role | null
  city?: string | null
  cats?: QuizCat[] | null
  time?: Availability[] | null
  exp?: Experience[] | null
}
export type QuizKey = keyof QuizAnswers

export interface Question { id: QuizKey; multi: boolean; options: readonly string[]; pose: CapyPose; seekerOnly?: boolean }
export const QUESTIONS: Question[] = [
  { id: 'goal', multi: false, options: ['seeker', 'employer'], pose: 'wave' },
  { id: 'city', multi: false, options: QUIZ_CITIES, pose: 'urgent', seekerOnly: true },
  { id: 'cats', multi: true, options: QUIZ_CATS, pose: 'cheer', seekerOnly: true },
  { id: 'time', multi: true, options: AVAILABILITY, pose: 'bath', seekerOnly: true },
  { id: 'exp', multi: true, options: EXPERIENCE, pose: 'wave', seekerOnly: true },
]

/** The questions still to ask (all of them when `all`, e.g. the admin's practice run). */
export function questionsFor(a: QuizAnswers, all = false): Question[] {
  const employer = a.goal === 'employer'
  return QUESTIONS.filter((q) => (all || !(q.id in a)) && !(employer && q.seekerOnly))
}

// ── stored on the device (works signed out, inside Zalo too) ────────────────────────────────────────────────────
const KEY = 'vtv-quiz'
interface Stored { device: string; answers: QuizAnswers; synced: string | null }
let memory: Stored | null = null
const listeners = new Set<() => void>()

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)))

export function readQuiz(): Stored {
  if (memory) return memory
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as Stored | null
    if (s && typeof s.device === 'string' && s.answers && typeof s.answers === 'object') return (memory = s)
  } catch { /* storage blocked or bad data: start fresh */ }
  return (memory = { device: newId(), answers: {}, synced: null })
}

export function writeQuiz(patch: Partial<Stored>) {
  memory = { ...readQuiz(), ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(memory)) } catch { /* kept in memory for this visit */ }
  listeners.forEach((f) => f())
}

/** Re-renders when the answers change (the job list re-sorts as soon as the quiz is done). */
export function useQuizAnswers(): QuizAnswers {
  const [a, setA] = useState(() => readQuiz().answers)
  useEffect(() => {
    const f = () => setA(readQuiz().answers)
    listeners.add(f)
    return () => { listeners.delete(f) }
  }, [])
  return a
}

/** How well a job fits: same city +1, a wanted kind of work +1 ("any" counts). Both → shown as "Hợp với bạn". */
export function fitScore(j: Job, a: QuizAnswers): number {
  const city = a.city && a.city !== 'other' && j.city === a.city ? 1 : 0
  const cat = a.cats?.length && (a.cats.includes('any') || a.cats.includes(j.category as QuizCat & Category)) ? 1 : 0
  return city + cat
}

/** Fits everything the person told Capy (only what they answered counts). */
export function isFit(j: Job, a: QuizAnswers): boolean {
  const asked = (a.city && a.city !== 'other' ? 1 : 0) + (a.cats?.length ? 1 : 0)
  return asked > 0 && fitScore(j, a) === asked
}
