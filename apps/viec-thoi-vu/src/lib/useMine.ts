import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { useSession } from './session'
import type { MyApplication } from './types'

/** My applications (with shift and money state) for the signed-in worker; null while loading. */
export function useMine() {
  const { profile } = useSession()
  const [list, setList] = useState<MyApplication[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const load = useCallback(() => {
    if (profile?.role !== 'seeker') { setList(null); return }
    setError(null)
    api.sweep().catch(() => undefined).then(() => api.myApplications()).then(setList).catch(setError)
  }, [profile?.id, profile?.role]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load])
  return { list, error, reload: load }
}
