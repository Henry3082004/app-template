import { Link } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'

/** The box a new person must tick: agreeing to the terms and the privacy policy (opened in a new tab so the form is kept). */
export function ConsentCheck({ checked, onChange }: { checked: boolean; onChange(v: boolean): void }) {
  const { t } = useI18n()
  return (
    <label className="consent">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
      <span>{t('consentAgree')} <Link to="/dieu-khoan" target="_blank" rel="noreferrer">{t('footTerms')}</Link> {t('consentAnd')} <Link to="/bao-mat" target="_blank" rel="noreferrer">{t('footPrivacy')}</Link>{t('consentWhat')}</span>
    </label>
  )
}
