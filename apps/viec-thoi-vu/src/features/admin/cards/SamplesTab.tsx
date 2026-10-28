import { Avatar, Skel, Tag } from '../../../components/ui'
import { WorkerFacts } from '../../account/WorkerFields'
import { useI18n } from '../../../lib/i18n'
import { avatarUrl } from '../../../lib/worker'
import type { AdminSamples, Availability, Experience } from '../../../lib/types'

export function SamplesTab({ s }: { s: AdminSamples | null }) {
  const { t } = useI18n()
  if (!s) return <Skel n={2} />
  return (
    <div className="stack">
      <p className="small muted">{t('samplesHint')}</p>
      <h2 style={{ fontSize: 17 }}>{t('samplesShops')} ({s.shops.length})</h2>
      <div className="g2">{s.shops.map((p) => (
        <article key={p.id} className="card stack">
          <div className="row"><Avatar square size={44} name={p.name ?? p.owner} src={avatarUrl(p.logo_path)} /><h3 style={{ fontSize: 16 }}>{p.name}</h3></div>
          <div className="small muted">{p.owner} · {[p.address, p.city].filter(Boolean).join(', ')}</div>
          <div><Tag tone="p">{t('samplesJobsN', { n: p.jobs })}</Tag></div>
        </article>
      ))}</div>
      <h2 style={{ fontSize: 17 }}>{t('samplesWorkers')} ({s.workers.length})</h2>
      <div className="g2">{s.workers.map((w) => (
        <article key={w.id} className="card stack">
          <div className="row"><Avatar size={44} name={w.name} src={avatarUrl(w.avatar_path)} /><h3 style={{ fontSize: 16 }}>{w.name}</h3></div>
          <div className="small muted">{w.city}</div>
          <WorkerFacts w={{ birth_year: w.birth_year, experience: (w.experience ?? []) as Experience[], availability: (w.availability ?? []) as Availability[], avatar_path: null }} />
          <div><Tag tone="p">{t('samplesAppsN', { n: w.applications })}</Tag></div>
        </article>
      ))}</div>
    </div>
  )
}
