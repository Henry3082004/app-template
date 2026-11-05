import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useI18n } from '../../lib/i18n'

const MINI_APP = 'https://zalo.me/s/2847107362388346804/'

/** The QR opens the Mini App; authentication happens there through the Zalo SDK. */
export function ZaloEntry() {
  const { locale } = useI18n()
  const [qr, setQr] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(MINI_APP, { width: 240, margin: 4, errorCorrectionLevel: 'M' })
      .then((url) => { if (live) setQr(url) }).catch(() => undefined)
    return () => { live = false }
  }, [])
  return <div className="card stack" style={{ boxShadow: 'none' }}>
    <b>{locale === 'vi' ? 'Đăng nhập Zalo / số điện thoại' : 'Zalo / phone sign-in'}</b>
    <div className="sub">{locale === 'vi' ? 'Quét mã bằng Zalo để vào Mini App Capi. Dùng chính điện thoại này thì bấm Mở Capi trong Zalo.' : 'Scan with Zalo to open Capi Mini App, or open it on this phone below.'}</div>
    {qr && <img src={qr} width={240} height={240} style={{ maxWidth: '100%', alignSelf: 'center' }} alt={locale === 'vi' ? 'Mã QR mở Mini App Capi' : 'QR code for Capi Mini App'} />}
    <a className="btn btn-primary block" href={MINI_APP} target="_blank" rel="noreferrer">{locale === 'vi' ? 'Mở Capi trong Zalo' : 'Open Capi in Zalo'}</a>
  </div>
}
