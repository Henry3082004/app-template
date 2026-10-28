import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Ic } from '../../components/Ic'
import { Btn, Tag } from '../../components/ui'
import { useAppConfig } from '../../lib/config'
import { useI18n } from '../../lib/i18n'
import { useSession } from '../../lib/session'

export function PricingCards({ onPro }: { onPro?: () => void }) {
  const { t, locale } = useI18n()
  const { profile } = useSession()
  const vi = locale === 'vi'
  const pro = profile?.plan === 'pro'
  return (
    <>
      <div className="card plancard">
        <b>{t('free')}</b>
        <div className="pay">{t('freePrice')}</div>
        <ul><li>{t('freeF1')}</li><li>{t('freeF2')}</li><li>{t('freeF3')}</li></ul>
        {profile?.role === 'employer' && !pro && <Btn v="ghost" block disabled>{t('currentPlan')}</Btn>}
      </div>
      <div className="card plancard pro">
        <div className="hrow"><b>{t('pro')}</b><Tag tone="sun"><Ic n="star" size={13} /> {t('popular')}</Tag></div>
        <div className="pay">{vi ? '149.000đ' : '$7'} <small>{t('perMonth')}</small></div>
        <div className="sub" style={{ fontSize: 14 }}>{vi ? '1.490.000đ' : '$70'}{t('perYear')} · {t('yearSave')}</div>
        <ul><li>{t('proF1')}</li><li>{t('proF2')}</li><li>{t('proF3')}</li></ul>
        {pro ? <Btn v="ghost" block disabled>{t('currentPlan')}</Btn> : onPro && <Btn block onClick={onPro}>{t('choosePro')}</Btn>}
      </div>
    </>
  )
}

export default function Pricing() {
  const { t } = useI18n()
  const nav = useNavigate()
  const [soon, setSoon] = useState(false)
  const cfg = useAppConfig()
  if (cfg?.billing === 'off') return <Navigate to="/app" replace />
  return (
    <div className="page-scroll"><div className="pg wide">
      <div className="row" style={{ marginBottom: 4 }}>
        <button type="button" className="back" aria-label={t('back')} onClick={() => (history.length > 1 ? nav(-1) : nav('/app'))}>←</button>
        <h1 className="ptitle">{t('pricingTitle')}</h1>
      </div>
      <p className="sub" style={{ marginBottom: 16 }}>{t('pricingSub')}</p>
      <div className="pricing"><PricingCards onPro={() => setSoon(true)} /></div>
      {soon && <div className="notice info mt16" role="status">{t('paySoon')}</div>}
    </div></div>
  )
}
