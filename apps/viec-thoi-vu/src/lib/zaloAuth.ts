import { AppError } from './types'

export interface ZaloCredentials { access_token: string; phone_token: string; name: string | null }

/**
 * Ask the Zalo app for the two tokens the server needs. Zalo shows its own "share your phone number?" popup.
 * The phone number itself never reaches the client: the server exchanges the tokens with Zalo.
 * In the mock build (no Zalo available) a fake phone is used so the whole flow can be tested.
 */
export async function getZaloCredentials(): Promise<ZaloCredentials> {
  if (import.meta.env.VITE_MOCK === '1') {
    let phone = '0988776655'
    try { phone = sessionStorage.getItem('mock-zalo-phone') || phone } catch { /* storage unavailable */ }
    if (phone === 'deny') throw new AppError('ZALO_DENIED')
    return { access_token: 'mock-access', phone_token: phone, name: 'Người Dùng Zalo' }
  }
  try {
    const { getAccessToken, getPhoneNumber, getUserInfo } = await import('zmp-sdk/apis')
    const phone = await getPhoneNumber()
    const token = (phone as { token?: string }).token
    const access = await getAccessToken()
    if (!token || !access) throw new Error('no token')
    let name: string | null = null
    try {
      const { userInfo } = await getUserInfo({ autoRequestPermission: false })
      name = userInfo?.name?.trim() || null
    } catch { /* name is optional: the user can type it */ }
    return { access_token: access, phone_token: token, name }
  } catch {
    throw new AppError('ZALO_DENIED')
  }
}
