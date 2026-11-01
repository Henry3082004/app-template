import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'
import { useAction } from '../../lib/useAction'
import { Btn, ErrorBox } from '../../components/ui'
import type { Referral } from '../../lib/types'

/** My referral code (and a link that carries it) plus a box to use a friend's code. Both sides get their posts pushed up for 7 days. */
export function ReferralCard() {
  const { t } = useI18n()
  const [r, setR] = useState<Referral | null>(null)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [used, setUsed] = useState(false)
  const act = useAction()
  useEffect(() => { api.myReferral().then(setR).catch(() => undefined) }, [])
  const link = r ? `${location.origin}/app?ref=${r.code}` : ''
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true) } catch { /* not allowed here */ } }
  return (
    <div className="stack">
      {r && (
        <>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}><span className="small muted">{t('refYourCode')}</span><b className="refcode">{r.code}</b></div>
          <div className="acts"><Btn v="ghost" sm onClick={copy}>{copied ? t('refCopied') : t('refCopy')}</Btn></div>
          {r.n > 0 && <div className="small muted">{t('refCount', { n: r.n })}</div>}
        </>
      )}
      {used
        ? <div className="notice ok">{t('refDone')}</div>
        : (
          <div className="row" style={{ gap: 8 }}>
            <input className="inp" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('refEnter')} aria-label={t('refEnter')} maxLength={12} />
            <Btn sm disabled={!code.trim() || act.busy === 'use'} onClick={() => act.run('use', async () => { await api.redeemReferral(code); setUsed(true) })}>{t('refUse')}</Btn>
          </div>
        )}
      {act.error != null && <ErrorBox error={act.error} where="ReferralCard" />}
    </div>
  )
}
