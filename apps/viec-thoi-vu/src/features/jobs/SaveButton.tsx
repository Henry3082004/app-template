import { Ic } from '../../components/Ic'
import { flyToCart } from '../../lib/flyToCart'
import { tap } from '../../lib/haptics'
import { useI18n } from '../../lib/i18n'
import { useSaved } from '../../lib/saved'

/** "+" adds the job to "Việc đã lưu" (a dot flies into the cart in the menu); "✓" means it is in, tap again to take it out. Works before signing in too. */
export function SaveButton({ jobId }: { jobId: string }) {
  const { t } = useI18n()
  const saved = useSaved()
  const on = saved.has(jobId)
  return (
    <button
      type="button" className={'savebtn' + (on ? ' on' : '')} aria-pressed={on} aria-label={t(on ? 'unsaveJob' : 'saveJob')} title={t(on ? 'unsaveJob' : 'saveJob')}
      onClick={(e) => { e.stopPropagation(); tap(); if (!on) flyToCart(e.currentTarget); void saved.toggle(jobId) }}
    >
      <Ic n={on ? 'check' : 'plus'} size={20} />
    </button>
  )
}
