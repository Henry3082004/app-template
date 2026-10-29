import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from './api'
import { qk } from './query'
import { useSession } from './session'

// "Việc đã lưu". Signed in: kept in the account (any device). Not signed in: kept on this device, moved into the account at sign-in.
const KEY = 'vtv-saved'
let memory: string[] = []
function readLocal(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch { return [...memory] }
}
function writeLocal(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { memory = [...ids] }
}
let merging: string | null = null

/** The saved job ids (newest first) and a toggle. Every caller shares one cached list. */
export function useSaved() {
  const { profile } = useSession()
  const client = useQueryClient()
  const uid = profile?.id
  const key = qk.saved(uid)
  const q = useQuery({ queryKey: key, queryFn: () => (uid ? api.savedJobIds() : Promise.resolve(readLocal())) })

  useEffect(() => {
    if (!uid || merging === uid) return
    const local = readLocal()
    if (!local.length) return
    merging = uid
    api.saveJobs(local)
      .then(() => { writeLocal([]); return client.invalidateQueries({ queryKey: qk.saved(uid) }) })
      .catch(() => undefined)
      .finally(() => { merging = null })
  }, [uid, client])

  const ids = q.data ?? []
  const toggle = async (jobId: string) => {
    const on = ids.includes(jobId)
    const next = on ? ids.filter((x) => x !== jobId) : [jobId, ...ids]
    client.setQueryData(key, next)
    try {
      if (!uid) writeLocal(next)
      else if (on) await api.unsaveJob(jobId)
      else await api.saveJobs([jobId])
    } catch { client.setQueryData(key, ids) }
  }
  return { ids, ready: !q.isLoading, has: (jobId: string) => ids.includes(jobId), toggle }
}
