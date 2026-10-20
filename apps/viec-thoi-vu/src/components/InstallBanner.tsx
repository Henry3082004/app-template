import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LOGO } from '../lib/capy'
import { useInstall } from '../lib/install'
import { useI18n } from '../lib/i18n'
import { Btn, Dialog } from './ui'

/** "Install the app" suggestion shown to everyone on the web (Android: one tap; iPhone: short how-to). */
export function InstallBanner() {
  const { t } = useI18n()
  const withNav = useLocation().pathname.startsWith('/app') // the phone's bottom bar is on screen
  const { show, ios, install, later } = useInstall()
  const [how, setHow] = useState(false)
  if (!show) return null
  return (
    <>
      <aside className={withNav ? 'install withnav' : 'install'} aria-label={t('installTitle')}>
        <img src={LOGO} alt="" width={44} height={44} />
        <div className="txt"><b>{t('installTitle')}</b><span>{t('installSub')}</span></div>
        <div className="acts">
          <Btn sm onClick={ios ? () => setHow(true) : () => void install()}>{ios ? t('installHow') : t('installBtn')}</Btn>
          <button type="button" className="x" onClick={later} aria-label={t('installLater')}>×</button>
        </div>
      </aside>
      {how && (
        <Dialog onClose={() => setHow(false)} label={t('installIosTitle')}>
          <h2>{t('installIosTitle')}</h2>
          <ol className="steps">
            <li>{t('installIos1')}</li>
            <li>{t('installIos2')}</li>
            <li>{t('installIos3')}</li>
          </ol>
          <Btn block onClick={() => setHow(false)}>{t('installIosOk')}</Btn>
        </Dialog>
      )}
    </>
  )
}
