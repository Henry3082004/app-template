import { AppError, type Api, type CapyReply } from '../types'
import { KEY, URL, sb } from './core'

/** Chat with Capy through the `capy-assistant` Edge Function (it needs the signed-in token, if any, to know who is asking). */
export const capyApi: Pick<Api, 'capyChat'> = {
  async capyChat(messages, ctx) {
    const { data } = await sb.auth.getSession()
    let res: Response
    try {
      res = await fetch(`${URL}/functions/v1/capy-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${data.session?.access_token ?? KEY}` },
        body: JSON.stringify({ messages, device: ctx.device, city: ctx.city }),
      })
    } catch (e) {
      throw new AppError('NETWORK', String(e))
    }
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new AppError(body.error || 'AI_FAILED')
    return body as CapyReply
  },
}
