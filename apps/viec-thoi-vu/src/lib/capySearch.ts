import { km, type Coords } from './geo'
import type { CapySearch, Job } from './types'

const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** How well a job fits what Capy understood: null = excluded by a hard filter, otherwise the number of keywords it matches. */
export function scoreJob(j: Job, s: CapySearch): number | null {
  if (s.category && j.category !== s.category) return null
  if (s.city && j.city !== s.city && !s.near) return null
  if (s.urgent && !j.is_urgent) return null
  if (s.min_pay && s.pay_unit && j.pay_unit === s.pay_unit && j.pay_amount < s.min_pay) return null
  if (s.near) {
    if (j.lat == null || j.lng == null) return null
    if (km(s.near, { lat: j.lat, lng: j.lng }) > s.radius_km) return null
  }
  const hay = strip(`${j.title} ${j.description ?? ''} ${j.business_name ?? ''} ${j.address} ${j.city}`)
  const hits = s.keywords.filter((k) => hay.includes(strip(k))).length
  const hard = !!(s.category || s.city || s.urgent || s.min_pay || s.near)
  if (!hard && s.keywords.length && hits === 0) return null // only words to go on: they must match something
  return hits
}

/** The jobs that fit, best first (nearest first when a place was named). */
export function runSearch(jobs: Job[], s: CapySearch): { job: Job; km: number | null }[] {
  const at: Coords | null = s.near
  return jobs
    .map((job) => ({ job, score: scoreJob(job, s), km: at && job.lat != null && job.lng != null ? km(at, { lat: job.lat, lng: job.lng }) : null }))
    .filter((r): r is { job: Job; score: number; km: number | null } => r.score !== null)
    .sort((a, b) => (at ? (a.km ?? 1e9) - (b.km ?? 1e9) : b.score - a.score || Number(b.job.is_urgent) - Number(a.job.is_urgent) || b.job.created_at.localeCompare(a.job.created_at)))
    .map(({ job, km }) => ({ job, km }))
}

/** One line saying what is being filtered, for the chip on the job list. */
export function describeSearch(s: CapySearch): string {
  return [s.keywords.join(', '), s.category && '', s.city, s.near?.name, s.urgent ? 'gấp' : '', s.min_pay ? `từ ${s.min_pay.toLocaleString('vi-VN')}đ` : ''].filter(Boolean).join(' · ')
}
