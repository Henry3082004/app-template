import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { money } from '../lib/format'
import type { EarningsSummary } from '../lib/earnings'
import { Ic } from './Ic'

/** "Withdraw" is not built yet (the admin transfers by hand), so the button is shown but locked. */
export function WithdrawBtn({ dark }: { dark?: boolean }) {
  const { t } = useI18n()
  return (
    <button type="button" className={'wbtn' + (dark ? ' dark' : '')} disabled title={t('withdrawSoon')}>
      <Ic n="arrow" size={16} /> {t('cashOut')} <small>{t('soon')}</small>
    </button>
  )
}

/** Home: this month's income at a glance, with the two buttons from the portal design. */
export function IncomeCard({ s }: { s: EarningsSummary | null }) {
  const { t, locale } = useI18n()
  return (
    <section className="card wallet">
      <div className="wtop"><span>{t('incomeThisMonth')}</span><Ic n="wallet" size={20} /></div>
      <div className="wamt">{s ? money(s.thisMonth, locale) : '…'}</div>
      {s?.estimated && <div className="wnote">{t('estimatedNote')}</div>}
      <div className="wacts">
        <WithdrawBtn dark />
        <Link className="wbtn" to="/app/thu-nhap">{t('navIncome')}</Link>
      </div>
    </section>
  )
}
