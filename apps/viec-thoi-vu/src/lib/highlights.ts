import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { qk } from './query'

/** Numbers + news for the banner. Refreshed every 5 minutes so the page keeps moving; a failure just means the fixed tips show. */
export function useHighlights() {
  return useQuery({ queryKey: qk.highlights, queryFn: () => api.homeHighlights(), staleTime: 4 * 60_000, refetchInterval: 5 * 60_000 }).data
}
