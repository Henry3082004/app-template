import { Ic } from '../../components/Ic'
import { tap } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { useSaved } from '../../lib/saved'

/** Bookmark a job for later ("Việc đã lưu"). Works before signing in too. */
export function SaveButton({ jobId }: { jobId: string }) {
  const { t } = useI18n()
  const saved = useSaved()
  const on = saved.has(jobId)
  return (
    <button
      type="button" className={'savebtn' + (on ? ' on' : '')} aria-pressed={on} aria-label={t(on ? 'unsaveJob' : 'saveJob')} title={t(on ? 'unsaveJob' : 'saveJob')}
      onClick={(e) => { e.stopPropagation(); tap(); void saved.toggle(jobId) }}
    >
      <Ic n="bookmark" size={18} />
    </button>
  )
}
