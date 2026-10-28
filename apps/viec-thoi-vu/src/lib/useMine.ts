import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { qk } from './query'
import { useSession } from './session'
import type { MyApplication } from './types'

/** My applications (with shift and money state) for the signed-in worker; null while loading. */
export function useMine() {
  const { profile } = useSession()
  const q = useQuery<MyApplication[]>({
    queryKey: qk.mine(profile?.id),
    queryFn: () => api.sweep().catch(() => undefined).then(() => api.myApplications()),
    enabled: profile?.role === 'seeker',
  })
  return { list: (profile?.role === 'seeker' && q.data) || null, error: q.error ?? null, reload: () => { void q.refetch() } }
}
