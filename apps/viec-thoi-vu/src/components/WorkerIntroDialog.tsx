import { useEffect, useState } from 'react'
import { capy } from '../lib/capy'
import { tap } from '../lib/haptics'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import type { WorkerInfo } from '../lib/types'
import { readQuiz } from '../lib/quiz'
import { introDue, markIntroNudged, markIntroSkipped } from '../lib/worker'
import { Btn, Dialog, ErrorBox } from './ui'
import { WorkerFields, workerInfoOf } from './WorkerFields'

/**
 * One screen after a worker's first sign-in (and once more on their first Apply if they chose "Later"):
 * photo, birth year, past work, free time — so businesses can choose. Taps only.
 */
export function WorkerIntroDialog() {
  const { profile, updateProfile, pending, authRequest, introRequest, closeIntro } = useSession()
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState<string | null>(null)
  const [w, setW] = useState<WorkerInfo | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const auto = !introRequest && !authRequest && !pending && dismissed !== profile?.id && introDue(profile)
  const open = !!profile && profile.role === 'seeker' && (!!introRequest || auto)
  useEffect(() => {
    if (!open || !profile) return
    // what they already told Capy is filled in for them
    const w0 = workerInfoOf(profile), a = readQuiz().answers
    setW({ ...w0, experience: w0.experience.length ? w0.experience : a.exp ?? [], availability: w0.availability.length ? w0.availability : a.time ?? [] })
  }, [open, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !profile || !w) return null
  const close = () => {
    markIntroSkipped(profile.id)
    if (introRequest) markIntroNudged(profile.id)
    setDismissed(profile.id)
    const next = introRequest?.onDone
    closeIntro()
    next?.()
  }
  const done = async () => {
    tap()
    setBusy(true); setError(null)
    try { await updateProfile(w); close() } catch (e) { setError(e) } finally { setBusy(false) }
  }

  return (
    <Dialog label={t('introTitle')}>
      <img className="wavecorner" src={capy('wave')} alt="" />
      <h2>{t('introTitle')}</h2>
      <div className="sub" style={{ marginTop: -8 }}>{introRequest?.beforeApply ? t('introBeforeApply') : t('introSub')}</div>
      <div className="stack">
        <WorkerFields name={profile.full_name} value={w} onChange={setW} />
        {error != null && <ErrorBox error={error} where="WorkerIntroDialog" />}
        <Btn block disabled={busy || !w.birth_year || !w.experience.length} onClick={() => void done()}>{busy ? '…' : t('introDone')}</Btn>
        <Btn v="text" block disabled={busy} onClick={close}>{t('introLater')}</Btn>
      </div>
    </Dialog>
  )
}
