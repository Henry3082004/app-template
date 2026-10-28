import { useI18n } from '../lib/i18n'
import { telHref, zaloHref } from '../lib/phone'
import { Ic } from './Ic'

/** "Gọi" + "Zalo" for a phone number. `block` makes both buttons full width (dialogs). */
export function ContactButtons({ phone, block }: { phone: string; block?: boolean }) {
  const { t } = useI18n()
  const size = block ? 'block' : 'sm'
  return (
    <>
      <a className={`btn btn-primary ${size}`} href={telHref(phone)}><Ic n="phone" size={16} /> {t('call')}</a>
      <a className={`btn btn-ghost ${size}`} href={zaloHref(phone)} target="_blank" rel="noreferrer"><Ic n="message" size={16} /> {t('zalo')}</a>
    </>
  )
}
