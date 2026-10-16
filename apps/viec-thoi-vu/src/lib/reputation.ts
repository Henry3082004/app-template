import type { Reputation } from './types'

export type RepLevel = 'new' | 'good' | 'ok' | 'warn'

/** Plain, explainable rules — no hidden score. New accounts are labelled "new", never punished. */
export function repLevel(r?: Reputation): RepLevel {
  if (!r) return 'new'
  if (r.noshow >= 2 || (r.ratings >= 3 && (r.avg_stars ?? 5) < 3)) return 'warn'
  if (r.shifts_done < 3) return 'new'
  if (r.shifts_done >= 5 && r.ratings >= 3 && (r.avg_stars ?? 0) >= 4.5 && r.noshow === 0) return 'good'
  return 'ok'
}
