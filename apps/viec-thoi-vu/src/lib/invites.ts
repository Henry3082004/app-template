import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { qk } from './query'
import { useSession } from './session'
import type { SentInvite } from './types'

/** Invitations this shop sent in the last 30 days (shared by "Nhân viên quen" and "Tìm người"). */
export function useSentInvites() {
  const { profile } = useSession()
  const client = useQueryClient()
  const key = qk.sentInvites(profile?.id)
  const { data } = useQuery({ queryKey: key, queryFn: () => api.mySentInvites().catch(() => [] as SentInvite[]), enabled: profile?.role === 'employer' })
  const sent = data ?? []
  return {
    jobsInvited: (workerId: string) => sent.filter((i) => i.worker_id === workerId).map((i) => i.job_id),
    markInvited: (jobId: string, workerId: string) => client.setQueryData<SentInvite[]>(key, (cur) => [...(cur ?? []), { job_id: jobId, worker_id: workerId }]),
  }
}
