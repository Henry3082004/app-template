import { useEffect, useState } from 'react'
import { Ic } from '../../components/Ic'
import { api } from '../../lib/api'
import type { WorkerNote } from '../../lib/types'

/** What other shops wrote about these workers (last two comments each), loaded once per set of ids. */
export function useWorkerNotes(ids: string[]): Record<string, WorkerNote[]> {
  const [map, setMap] = useState<Record<string, WorkerNote[]>>({})
  const key = [...new Set(ids)].sort().join(',')
  useEffect(() => {
    if (key) api.workerNotes(key.split(',')).then(setMap).catch(() => undefined)
  }, [key])
  return map
}

/** Short quotes under a candidate: “Chăm chỉ, đến sớm” — Quán X. */
export function WorkerNotes({ notes }: { notes?: WorkerNote[] }) {
  if (!notes?.length) return null
  return (
    <div className="stack wnotes">
      {notes.map((n) => <div key={n.created_at + n.shop_name} className="small muted"><Ic n="star" size={12} /> {n.stars} · “{n.comment}” — {n.shop_name}</div>)}
    </div>
  )
}
