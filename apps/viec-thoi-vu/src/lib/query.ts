import { QueryClient } from '@tanstack/react-query'

/** One shared cache for server data: pages that need the same list (e.g. the shop's hires) share one request.
 *  No automatic retries or refetch-on-focus, so errors show at once and screens do not jump while someone is reading. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

/** Query keys in one place, so a change can refresh every screen that shows the same data. */
export const qk = {
  config: ['config'] as const,
  highlights: ['highlights'] as const,
  hires: (uid: string | undefined) => ['hires', uid] as const,
  mine: (uid: string | undefined) => ['mine', uid] as const,
  sentInvites: (uid: string | undefined) => ['sentInvites', uid] as const,
  discoverable: (uid: string | undefined) => ['discoverable', uid] as const,
  pendingReviews: (uid: string | undefined) => ['pendingReviews', uid] as const,
  myJobs: (uid: string | undefined) => ['myJobs', uid] as const,
}
