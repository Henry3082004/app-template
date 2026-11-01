import { AppError, type Api } from '../types'
import { apps, me, jobOf, notify, now, users, wait, jobs, bizOf, personOf } from './core'

/** Job guides (job id → text), referral codes (user → code) and who used whose code. */
export const guides: Record<string, string> = {}
const codes: Record<string, string> = {}
const referred: Record<string, string> = {} // referred user → referrer
const codeOf = (uid: string) => (codes[uid] ??= (uid.replace(/\D/g, '') + 'A1B2C3').slice(-6).toUpperCase())
const boost = (uid: string) => { jobs.filter((j) => j.employer_id === uid && j.status === 'open').forEach((j) => { j.boosted_until = new Date(Date.now() + 7 * 864e5).toISOString() }) }

export const hireToolsMock: Pick<Api, 'setJobGuide' | 'jobGuide' | 'agreeShift' | 'myReferral' | 'redeemReferral'> = {
  async setJobGuide(jobId, body) {
    const j = jobs.find((x) => x.id === jobId)
    if (!j || j.employer_id !== me().id) throw new AppError('FORBIDDEN')
    guides[jobId] = body.trim().slice(0, 600)
    return wait(undefined)
  },
  async jobGuide(jobId) {
    const p = me()
    const j = jobs.find((x) => x.id === jobId)
    const ok = !!j && (j.employer_id === p.id || apps.some((a) => a.job_id === jobId && a.seeker_id === p.id && a.status === 'accepted'))
    return wait(ok && guides[jobId] ? guides[jobId] : null)
  },
  async agreeShift(id) {
    const p = me()
    const a = apps.find((x) => x.id === id)
    if (!a) throw new AppError('NOT_FOUND')
    const j = jobOf(a)
    if (p.id !== a.seeker_id && p.id !== j.employer_id) throw new AppError('FORBIDDEN')
    if (a.status !== 'accepted') throw new AppError('NOT_ACCEPTED')
    if (!['none', 'held'].includes(a.pay_status)) throw new AppError('ALREADY_SETTLED')
    const seeker = p.id === a.seeker_id
    if (seeker ? a.agreed_seeker_at : a.agreed_employer_at) return wait(undefined)
    if (seeker) a.agreed_seeker_at = now(); else a.agreed_employer_at = now()
    notify(seeker ? j.employer_id : a.seeker_id, 'agreed', `${seeker ? personOf(p.id) : bizOf(j)} xác nhận thỏa thuận ca`, `"${j.title}" — vào xem và xác nhận nếu bạn đồng ý`, seeker ? '/app/ca-lam' : '/app/cham-cong')
    return wait(undefined)
  },
  async myReferral() {
    const p = me()
    return wait({ code: codeOf(p.id), n: Object.values(referred).filter((r) => r === p.id).length })
  },
  async redeemReferral(code) {
    const p = me()
    const ref = Object.keys(users).find((id) => codeOf(id) === code.trim().toUpperCase())
    if (!ref) throw new AppError('BAD_CODE')
    if (ref === p.id) throw new AppError('OWN_CODE')
    if (referred[p.id]) throw new AppError('ALREADY_REFERRED')
    referred[p.id] = ref
    boost(ref); boost(p.id)
    notify(ref, 'referral', 'Bạn bè dùng mã của bạn', 'Tin của bạn được đẩy lên đầu trong 7 ngày. Cảm ơn bạn đã giới thiệu!', '/app/tai-khoan')
    return wait(undefined)
  },
}
