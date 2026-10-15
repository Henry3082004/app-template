import { useState } from 'react'
import { Topbar } from '../components/Topbar'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'

export function PricingCards({ onPro }: { onPro?: () => void }) {
  const { t, locale } = useI18n()
  const { profile } = useSession()
  const vi = locale === 'vi'
  const pro = profile?.plan === 'pro'
  return (
    <>
      <div className="card plan">
        <div className="bold">{t('free')}</div>
        <div className="price">{t('freePrice')}</div>
        <ul><li>{t('freeF1')}</li><li>{t('freeF2')}</li><li>{t('freeF3')}</li></ul>
        {profile?.role === 'employer' && !pro && <div className="badge gray mt-12">{t('currentPlan')}</div>}
      </div>
      <div className="card plan featured">
        <div className="row between"><span className="bold">{t('pro')}</span><span className="badge pro">⭐</span></div>
        <div className="price">{vi ? '149.000đ' : '$7'}<span className="muted small" style={{ fontWeight: 500 }}>{t('perMonth')}</span></div>
        <div className="muted small">{vi ? '1.490.000đ' : '$70'}{t('perYear')} · {t('yearSave')}</div>
        <ul><li>{t('proF1')}</li><li>{t('proF2')}</li><li>{t('proF3')}</li></ul>
        {pro ? <div className="badge ok mt-12">{t('currentPlan')}</div>
          : onPro && <button className="btn primary block mt-16" onClick={onPro}>{t('choosePro')}</button>}
      </div>
    </>
  )
}

export default function Pricing() {
  const { t } = useI18n()
  const [soon, setSoon] = useState(false)
  return (
    <div className="page-enter">
      <Topbar title={t('pricingTitle')} back />
      <p className="subtitle">{t('pricingSub')}</p>
      <PricingCards onPro={() => setSoon(true)} />
      {soon && <div className="notice info mt-12" role="status">{t('paySoon')}</div>}
    </div>
  )
}
