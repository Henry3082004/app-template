import { Link } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'

/** Small footer row: the intro page and the legal pages (also what Google/Zalo reviewers look for). */
export function LegalLinks() {
  const { t } = useI18n()
  return (
    <nav className="legallinks" aria-label={t('legal')}>
      <Link to="/gioi-thieu">{t('footAbout')}</Link>
      <Link to="/dieu-khoan">{t('footTerms')}</Link>
      <Link to="/bao-mat">{t('footPrivacy')}</Link>
    </nav>
  )
}
