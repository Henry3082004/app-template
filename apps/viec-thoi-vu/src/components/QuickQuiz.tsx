import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { capy } from '../lib/capy'
import { tap } from '../lib/haptics'
import { useI18n, type TKey } from '../lib/i18n'
import { questionsFor, QUESTIONS, readQuiz, writeQuiz, type Question, type QuizAnswers } from '../lib/quiz'
import { useSession } from '../lib/session'
import { Ic } from './Ic'
import { Btn, Dialog } from './ui'

const QTEXT: Record<Question['id'], TKey> = { goal: 'quizGoalQ', city: 'quizCityQ', cats: 'quizCatsQ', time: 'quizTimeQ', exp: 'quizExpQ' }

/** Label of one answer, reusing the words the rest of the app already uses. */
function optKey(q: Question['id'], o: string): TKey | null {
  if (q === 'goal') return o === 'seeker' ? 'roleCardSeeker' : 'roleCardEmployer'
  if (q === 'city') return o === 'other' ? 'quizCityOther' : null
  if (q === 'cats') return o === 'any' ? 'quizCatAny' : (`cat${o}` as TKey)
  if (q === 'time') return `avail_${o}` as TKey
  return `exp_${o}` as TKey
}
// "anything" / "never worked yet" can't be picked together with other answers
const ALONE = new Set(['any', 'none'])

interface Run { base: QuizAnswers; draft: QuizAnswers; i: number; all: boolean; done: boolean }

/**
 * "Capy hỏi nhanh": shown once, the first time someone opens the app (signed in or not). Each question is asked only
 * once — a skipped one is stored as null — so later only newly added questions come up. Admins can run it again
 * from Account to try out the wording.
 */
export function QuickQuiz() {
  const { t } = useI18n()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { profile, ready, pending, authRequest, introRequest, quizRequest, closeQuiz, askAuth } = useSession()
  const [synced, setSynced] = useState<string | null | undefined>(undefined) // profile id whose answers are merged
  const [run, setRun] = useState<Run | null>(null)

  // Signed in: merge the account's answers with this device's and link them to the account.
  useEffect(() => {
    if (!ready) return
    if (!profile) { setSynced(null); return }
    let live = true
    api.myQuiz().catch(() => ({} as QuizAnswers)).then((server) => {
      if (!live) return
      const s = readQuiz()
      const answers: QuizAnswers = { ...server, ...s.answers }
      if (!('goal' in answers)) answers.goal = profile.role
      writeQuiz({ answers })
      if (s.synced !== profile.id && Object.keys(answers).length) {
        api.saveQuiz(s.device, answers).then(() => writeQuiz({ synced: profile.id })).catch(() => undefined)
      }
      setSynced(profile.id)
    })
    return () => { live = false }
  }, [ready, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const settled = ready && synced === (profile?.id ?? null)
  const busyElsewhere = !!authRequest || !!pending || !!introRequest
  useEffect(() => {
    if (run || busyElsewhere || !settled) return
    const base = readQuiz().answers
    if (quizRequest) setRun({ base, draft: {}, i: 0, all: !!quizRequest.all, done: false })
    else if (pathname.startsWith('/app') && questionsFor(base).length) setRun({ base, draft: {}, i: 0, all: false, done: false })
  }, [settled, busyElsewhere, quizRequest, pathname, run])

  if (!run) return null
  // the questions of this run depend on the answers so far: a business is not asked the worker questions
  const askedFor = (draft: QuizAnswers) => (run.all
    ? questionsFor(draft, true)
    : QUESTIONS.filter((x) => !(x.id in run.base) && !((draft.goal ?? run.base.goal) === 'employer' && x.seekerOnly)))
  const asked = askedFor(run.draft)
  const q = asked[run.i]
  const total = asked.length

  const save = (draft: QuizAnswers) => {
    // every question shown but not answered is stored as skipped, so it is never asked again
    const skipped = Object.fromEntries(asked.filter((x) => !(x.id in draft)).map((x) => [x.id, null]))
    const answers = { ...readQuiz().answers, ...skipped, ...draft }
    writeQuiz({ answers })
    api.saveQuiz(readQuiz().device, answers).catch(() => undefined)
  }
  const finish = (draft: QuizAnswers) => { save(draft); setRun({ ...run, draft, done: true }) }
  const next = (draft: QuizAnswers) => (run.i + 1 >= askedFor(draft).length ? finish(draft) : setRun({ ...run, draft, i: run.i + 1 }))
  const close = () => { setRun(null); closeQuiz() }

  if (run.done) {
    const employer = (run.draft.goal ?? readQuiz().answers.goal) === 'employer'
    const post = () => {
      close()
      if (profile?.role === 'employer') nav('/app/dang-tin')
      else askAuth({ role: 'employer', onDone: (p) => nav(p.role === 'employer' ? '/app/dang-tin' : '/app') })
    }
    return (
      <Dialog label={t('quizDoneTitle')}>
        <div className="quiz done">
          <img className="capy hop" src={capy('cheer')} alt="" />
          <h2>{t('quizDoneTitle')}</h2>
          <div className="sub">{t(employer ? 'quizDoneEmployer' : 'quizDoneSeeker')}</div>
          {employer
            ? <><Btn block onClick={post}>{t('quizPostJob')}</Btn><Btn v="text" block onClick={close}>{t('quizSeeJobs')}</Btn></>
            : <Btn block onClick={() => { close(); nav('/app') }}>{t('quizSeeFit')}</Btn>}
        </div>
      </Dialog>
    )
  }
  if (!q) return null

  const cur = run.draft[q.id] as string | string[] | undefined
  const picked = (o: string) => (Array.isArray(cur) ? cur.includes(o) : cur === o)
  const pick = (o: string) => {
    tap()
    if (!q.multi) { next({ ...run.draft, [q.id]: o }); return }
    const list = Array.isArray(cur) ? cur : []
    const nextList = list.includes(o) ? list.filter((x) => x !== o) : ALONE.has(o) ? [o] : [...list.filter((x) => !ALONE.has(x)), o]
    const draft = { ...run.draft }
    if (nextList.length) Object.assign(draft, { [q.id]: nextList }); else delete draft[q.id]
    setRun({ ...run, draft })
  }
  const skipQuestion = () => { const draft = { ...run.draft, [q.id]: null }; next(draft) }

  return (
    <Dialog label={t('quizTitle')}>
      <div className="quiz">
        <div className="qtop">
          {run.i > 0
            ? <button type="button" className="qback" aria-label={t('back')} onClick={() => setRun({ ...run, i: run.i - 1 })}><Ic n="chevL" size={20} /></button>
            : <span />}
          <div className="qsteps" aria-label={`${run.i + 1} / ${total}`}>{asked.map((x, i) => <i key={x.id} className={i <= run.i ? 'on' : ''} />)}</div>
          <button type="button" className="qskip" onClick={() => finish(run.draft)}>{t('quizLater')}</button>
        </div>
        <div className="qcapy">
          <img src={capy(q.pose)} alt="" />
          <div className="qbubble">
            {run.i === 0 && <span className="qhello">{t(run.all ? 'quizAdminHello' : 'quizHello')}</span>}
            <b>{t(QTEXT[q.id])}</b>
            {q.multi && <span className="qhint">{t('quizMulti')}</span>}
          </div>
        </div>
        <div className={q.options.length > 4 ? 'qopts two' : 'qopts'}>
          {q.options.map((o) => {
            const k = optKey(q.id, o)
            return (
              <button key={o} type="button" className={picked(o) ? 'qopt on' : 'qopt'} aria-pressed={picked(o)} onClick={() => pick(o)}>
                {k ? t(k) : o}{picked(o) && <span className="qcheck">✓</span>}
              </button>
            )
          })}
        </div>
        {q.multi && (cur?.length
          ? <Btn block onClick={() => next(run.draft)}>{t('quizNext')}</Btn>
          : <Btn v="text" block onClick={skipQuestion}>{t('quizSkipQ')}</Btn>)}
        {!q.multi && <Btn v="text" block onClick={skipQuestion}>{t('quizSkipQ')}</Btn>}
      </div>
    </Dialog>
  )
}
