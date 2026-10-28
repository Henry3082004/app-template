import { type Api, type Applicant, type Hire, type JobInput, type MyApplication, type MyJob } from '../types'
import { sb, JOB_COLS, fail, rpc, toJob, uid, WORKER_COLS, toWorker, phonesOf, ESCROW_COLS, otherReviewed, reviewedSet, payoutsOf, toEscrow } from './core'

export const jobsApi: Pick<Api, 'listOpenJobs' | 'getJob' | 'myApplicationStatus' | 'apply' | 'myApplications' | 'withdraw' | 'myJobs' | 'createJob' | 'setJobStatus' | 'applicantsFor' | 'myHires' | 'decide'> = {
  async listOpenJobs() {
    const { data, error } = await sb.from('jobs').select(JOB_COLS).eq('status', 'open')
      .order('is_urgent', { ascending: false }).order('created_at', { ascending: false }).limit(200)
    if (error) fail(error)
    return (data ?? []).map(toJob)
  },

  async getJob(id) {
    const { data, error } = await sb.from('jobs').select(JOB_COLS).eq('id', id).maybeSingle()
    if (error) fail(error)
    return data ? toJob(data) : null
  },

  async myApplicationStatus() {
    const { data } = await sb.auth.getSession()
    if (!data.session) return {}
    const { data: rows } = await sb.from('applications').select('job_id, status').eq('seeker_id', data.session.user.id)
    return Object.fromEntries((rows ?? []).map((r) => [r.job_id, r.status]))
  },

  async apply(jobId, message) {
    const id = await uid()
    // A withdrawn application blocks re-applying (unique job+seeker); treat it as "already applied".
    const { error } = await sb.from('applications').insert({ job_id: jobId, seeker_id: id, message: message.trim() || null })
    if (error) fail(error)
  },

  async myApplications() {
    const id = await uid()
    const { data, error } = await sb.from('applications')
      .select(`id, status, message, created_at, ${ESCROW_COLS}, job:jobs(${JOB_COLS})`)
      .eq('seeker_id', id).order('created_at', { ascending: false })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []).filter((r: any) => r.job) as any[]
    const accepted = rows.filter((r) => r.status === 'accepted').map((r) => r.job.employer_id)
    // The database only returns an employer's phone once the money for that shift is held.
    const ids = rows.map((r) => r.id)
    const [phones, done, payouts, other] = await Promise.all([phonesOf(accepted), reviewedSet(ids, id), payoutsOf(ids), otherReviewed(ids)])
    return rows.map((r): MyApplication => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, ...toEscrow(r, done.has(r.id), other.has(r.id)), payout: payouts[r.id] ?? null,
      job: toJob(r.job), employer_phone: r.status === 'accepted' ? phones[r.job.employer_id] ?? null : null,
    }))
  },

  async withdraw(applicationId) {
    await rpc('withdraw_application', { p_application: applicationId })
  },

  async myJobs() {
    const id = await uid()
    const { data, error } = await sb.from('jobs').select(`${JOB_COLS}, applications(id, status, seen_by_employer)`)
      .eq('employer_id', id).order('created_at', { ascending: false })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any): MyJob => {
      const apps = (r.applications ?? []).filter((a: { status: string }) => a.status !== 'withdrawn')
      const { applications: _a, ...job } = r
      return {
        ...toJob(job),
        applicants: apps.length,
        newApplicants: apps.filter((a: { seen_by_employer: boolean; status: string }) => !a.seen_by_employer && a.status === 'pending').length,
      }
    })
  },

  async createJob(input: JobInput) {
    const id = await uid()
    const { data, error } = await sb.from('jobs').insert({ ...input, employer_id: id }).select(JOB_COLS).single()
    if (error) fail(error)
    return toJob(data)
  },

  async setJobStatus(jobId, status) {
    const { error } = await sb.from('jobs').update({ status }).eq('id', jobId)
    if (error) fail(error)
  },

  async applicantsFor(jobId) {
    const { data, error } = await sb.from('applications')
      .select(`id, status, message, created_at, seeker_id, ${ESCROW_COLS}, seeker:profiles!applications_seeker_id_fkey(full_name, worker_profiles(${WORKER_COLS}))`)
      .eq('job_id', jobId).neq('status', 'withdrawn').order('created_at', { ascending: true })
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[]
    const me = await uid()
    const ids = rows.map((r) => r.id)
    const [phones, done, other] = await Promise.all([phonesOf(rows.filter((r) => r.status === 'accepted').map((r) => r.seeker_id)), reviewedSet(ids, me), otherReviewed(ids)])
    sb.rpc('mark_applications_seen', { p_job: jobId }).then(() => undefined)
    return rows.map((r): Applicant => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, seeker_id: r.seeker_id, ...toEscrow(r, done.has(r.id), other.has(r.id)),
      full_name: r.seeker?.full_name ?? '—', phone: phones[r.seeker_id] ?? null,
      ...toWorker([r.seeker?.worker_profiles].flat()[0]),
    }))
  },

  async myHires() {
    const me = await uid()
    const { data, error } = await sb.from('applications')
      .select(`id, status, message, created_at, seeker_id, ${ESCROW_COLS}, job:jobs!inner(${JOB_COLS}), seeker:profiles!applications_seeker_id_fkey(full_name, worker_profiles(${WORKER_COLS}))`)
      .eq('job.employer_id', me).neq('status', 'withdrawn').order('created_at', { ascending: false }).limit(300)
    if (error) fail(error)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []) as any[]
    const ids = rows.map((r) => r.id)
    const [phones, done, other] = await Promise.all([phonesOf(rows.filter((r) => r.status === 'accepted').map((r) => r.seeker_id)), reviewedSet(ids, me), otherReviewed(ids)])
    return rows.map((r): Hire => ({
      id: r.id, status: r.status, message: r.message, created_at: r.created_at, seeker_id: r.seeker_id, ...toEscrow(r, done.has(r.id), other.has(r.id)),
      full_name: r.seeker?.full_name ?? '—', phone: phones[r.seeker_id] ?? null, job: toJob(r.job), ...toWorker([r.seeker?.worker_profiles].flat()[0]),
    }))
  },

  async decide(applicationId, decision) {
    await rpc('decide_application', { p_application: applicationId, p_decision: decision })
    if (decision !== 'accepted') return { phone: null }
    const { data } = await sb.from('applications').select('seeker_id').eq('id', applicationId).single()
    const phones = await phonesOf(data ? [data.seeker_id] : [])
    return { phone: data ? phones[data.seeker_id] ?? null : null }
  }
}
