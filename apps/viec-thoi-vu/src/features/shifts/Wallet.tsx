import { useI18n } from '../../lib/i18n'
import { Ic } from '../../components/Ic'

/** "Withdraw" is not built yet (the admin transfers by hand), so the button is shown but locked. */
export function WithdrawBtn({ dark }: { dark?: boolean }) {
  const { t } = useI18n()
  return (
    <button type="button" className={'wbtn' + (dark ? ' dark' : '')} disabled title={t('withdrawSoon')}>
      <Ic n="arrow" size={16} /> {t('cashOut')} <small>{t('soon')}</small>
    </button>
  )
}
