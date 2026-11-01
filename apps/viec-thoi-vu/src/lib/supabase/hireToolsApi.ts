import type { Api, Referral } from '../types'
import { rpc } from './core'

/** Job guide, shift agreement and referral codes. */
export const hireToolsApi: Pick<Api, 'setJobGuide' | 'jobGuide' | 'agreeShift' | 'myReferral' | 'redeemReferral'> = {
  async setJobGuide(jobId, body) {
    await rpc('set_job_guide', { p_job: jobId, p_body: body })
  },
  async jobGuide(jobId) {
    return ((await rpc('job_guide', { p_job: jobId })) as string | null) ?? null
  },
  async agreeShift(applicationId) {
    await rpc('agree_shift', { p_application: applicationId })
  },
  async myReferral() {
    const rows = ((await rpc('my_referral')) ?? []) as Referral[]
    return { code: rows[0]?.code ?? '', n: Number(rows[0]?.n) || 0 }
  },
  async redeemReferral(code) {
    await rpc('redeem_referral', { p_code: code })
  },
}
