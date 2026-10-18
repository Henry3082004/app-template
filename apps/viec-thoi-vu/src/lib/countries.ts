import type { Locale } from './types'

export interface Country { iso: string; dial: string; vi: string; en: string }

/** Common countries for the phone-number picker (Vietnam first). Dial codes without "+". */
export const COUNTRIES: Country[] = [
  { iso: 'VN', dial: '84', vi: 'Việt Nam', en: 'Vietnam' },
  { iso: 'US', dial: '1', vi: 'Hoa Kỳ', en: 'United States' },
  { iso: 'CA', dial: '1', vi: 'Canada', en: 'Canada' },
  { iso: 'GB', dial: '44', vi: 'Vương quốc Anh', en: 'United Kingdom' },
  { iso: 'AU', dial: '61', vi: 'Úc', en: 'Australia' },
  { iso: 'NZ', dial: '64', vi: 'New Zealand', en: 'New Zealand' },
  { iso: 'SG', dial: '65', vi: 'Singapore', en: 'Singapore' },
  { iso: 'MY', dial: '60', vi: 'Malaysia', en: 'Malaysia' },
  { iso: 'TH', dial: '66', vi: 'Thái Lan', en: 'Thailand' },
  { iso: 'ID', dial: '62', vi: 'Indonesia', en: 'Indonesia' },
  { iso: 'PH', dial: '63', vi: 'Philippines', en: 'Philippines' },
  { iso: 'KH', dial: '855', vi: 'Campuchia', en: 'Cambodia' },
  { iso: 'LA', dial: '856', vi: 'Lào', en: 'Laos' },
  { iso: 'MM', dial: '95', vi: 'Myanmar', en: 'Myanmar' },
  { iso: 'CN', dial: '86', vi: 'Trung Quốc', en: 'China' },
  { iso: 'HK', dial: '852', vi: 'Hồng Kông', en: 'Hong Kong' },
  { iso: 'TW', dial: '886', vi: 'Đài Loan', en: 'Taiwan' },
  { iso: 'JP', dial: '81', vi: 'Nhật Bản', en: 'Japan' },
  { iso: 'KR', dial: '82', vi: 'Hàn Quốc', en: 'South Korea' },
  { iso: 'IN', dial: '91', vi: 'Ấn Độ', en: 'India' },
  { iso: 'PK', dial: '92', vi: 'Pakistan', en: 'Pakistan' },
  { iso: 'BD', dial: '880', vi: 'Bangladesh', en: 'Bangladesh' },
  { iso: 'AE', dial: '971', vi: 'UAE', en: 'United Arab Emirates' },
  { iso: 'SA', dial: '966', vi: 'Ả Rập Xê Út', en: 'Saudi Arabia' },
  { iso: 'IL', dial: '972', vi: 'Israel', en: 'Israel' },
  { iso: 'TR', dial: '90', vi: 'Thổ Nhĩ Kỳ', en: 'Türkiye' },
  { iso: 'RU', dial: '7', vi: 'Nga', en: 'Russia' },
  { iso: 'DE', dial: '49', vi: 'Đức', en: 'Germany' },
  { iso: 'FR', dial: '33', vi: 'Pháp', en: 'France' },
  { iso: 'IT', dial: '39', vi: 'Ý', en: 'Italy' },
  { iso: 'ES', dial: '34', vi: 'Tây Ban Nha', en: 'Spain' },
  { iso: 'PT', dial: '351', vi: 'Bồ Đào Nha', en: 'Portugal' },
  { iso: 'NL', dial: '31', vi: 'Hà Lan', en: 'Netherlands' },
  { iso: 'BE', dial: '32', vi: 'Bỉ', en: 'Belgium' },
  { iso: 'CH', dial: '41', vi: 'Thụy Sĩ', en: 'Switzerland' },
  { iso: 'AT', dial: '43', vi: 'Áo', en: 'Austria' },
  { iso: 'SE', dial: '46', vi: 'Thụy Điển', en: 'Sweden' },
  { iso: 'NO', dial: '47', vi: 'Na Uy', en: 'Norway' },
  { iso: 'DK', dial: '45', vi: 'Đan Mạch', en: 'Denmark' },
  { iso: 'FI', dial: '358', vi: 'Phần Lan', en: 'Finland' },
  { iso: 'IE', dial: '353', vi: 'Ireland', en: 'Ireland' },
  { iso: 'PL', dial: '48', vi: 'Ba Lan', en: 'Poland' },
  { iso: 'CZ', dial: '420', vi: 'Séc', en: 'Czechia' },
  { iso: 'UA', dial: '380', vi: 'Ukraina', en: 'Ukraine' },
  { iso: 'BR', dial: '55', vi: 'Brazil', en: 'Brazil' },
  { iso: 'MX', dial: '52', vi: 'Mexico', en: 'Mexico' },
  { iso: 'AR', dial: '54', vi: 'Argentina', en: 'Argentina' },
  { iso: 'ZA', dial: '27', vi: 'Nam Phi', en: 'South Africa' },
  { iso: 'NG', dial: '234', vi: 'Nigeria', en: 'Nigeria' },
  { iso: 'EG', dial: '20', vi: 'Ai Cập', en: 'Egypt' },
]

/** Best guess for the picker: the browser's region (en-GB → GB), else Vietnam for Vietnamese UI, else US. */
export function guessCountry(locale: Locale): Country {
  let region = ''
  try { region = new Intl.Locale(navigator.language).region ?? '' } catch { /* old browser */ }
  const found = COUNTRIES.find((c) => c.iso === region)
  if (found) return found
  return COUNTRIES.find((c) => c.iso === (locale === 'vi' ? 'VN' : 'US'))!
}

/**
 * Joins the picked country and what the person typed into "+<dial><national number>".
 * A typed "+…" wins (they pasted a full international number); one leading 0 is the local trunk prefix and is dropped.
 */
export function fullPhone(country: Country, typed: string): string {
  const raw = typed.trim()
  if (raw.startsWith('+')) return '+' + raw.replace(/\D/g, '')
  const digits = raw.replace(/\D/g, '').replace(/^0/, '')
  return `+${country.dial}${digits}`
}
