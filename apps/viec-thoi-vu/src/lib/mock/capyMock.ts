import { addDays, today } from '../format'
import type { Api, CapyDraft, CapySearch } from '../types'
import { current, users } from './core'

// A small rule-based stand-in for the real AI (used by tests and the demo build): it reads obvious words, not the language.
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
const has = (t: string, re: RegExp) => re.test(t)
const money = (t: string): number | null => {
  const k = t.match(/(\d+)\s*(k\b|nghin|ngan)/)
  if (k) return Number(k[1]) * 1000
  const n = t.match(/\b(\d{5,9})\b/)
  return n ? Number(n[1]) : null
}
const CITY: [RegExp, string][] = [[/ha noi/, 'Hà Nội'], [/da nang/, 'Đà Nẵng'], [/can tho/, 'Cần Thơ'], [/binh duong/, 'Bình Dương'], [/sai gon|ho chi minh|hcm/, 'TP.HCM']]
const CAT: [RegExp, CapySearch['category']][] = [[/phuc vu|quan an|nha hang|ca phe|pha che|bep|chen/, 'service'], [/\bkho\b|boc xep|soan hang/, 'warehouse'], [/su kien|le tan/, 'event'], [/nong|thu hoach|hai /, 'farm'], [/ban hang|cua hang|sieu thi/, 'retail']]

export const capyMock: Pick<Api, 'capyChat'> = {
  async capyChat(messages) {
    const p = current ? users[current]?.profile : null // visitors may ask too
    const text = strip(messages[messages.length - 1]?.text ?? '')
    await new Promise((r) => setTimeout(r, 200))
    if (p?.role === 'employer') {
      const slots = Number(text.match(/(\d+)\s*(nguoi|ban|bac)/)?.[1] ?? 1)
      const unit: CapyDraft['pay_unit'] = has(text, /\/\s*ngay|moi ngay|mot ngay/) ? 'day' : 'hour'
      const role = has(text, /phu bep/) ? 'Phụ bếp' : has(text, /phuc vu/) ? 'Phục vụ' : has(text, /rua chen/) ? 'Rửa chén' : has(text, /pha che/) ? 'Pha chế' : 'Nhân viên thời vụ'
      const start = has(text, /\bmai\b/) ? addDays(today(), 1) : today()
      const note = has(text, /\bnu\b|\bnam\b|gioi tinh/) ? ' Mình đã bỏ yêu cầu về giới tính vì không được phân biệt đối xử khi đăng tin.' : ''
      const pay = money(text)
      if (!has(text, /\d|can|tim|tuyen|them/)) return { role: 'employer', reply: 'Bạn cần tuyển mấy người, làm việc gì và vào ngày nào?' }
      return {
        role: 'employer',
        reply: `Mình đã soạn bản nháp tin "${role}".${pay ? '' : ' Mình chưa điền lương, bạn nhập thêm nhé.'}${note}`,
        draft: { title: `Cần ${slots} ${role.toLowerCase()}`, description: `${role} theo ca, ${slots} người. Làm việc nhanh nhẹn, đúng giờ.`, category: 'service', pay_amount: pay, pay_unit: unit, slots, start_date: start, end_date: start, shift_note: '', address: '', city: p?.city ?? '', is_urgent: has(text, /gap|mai\b/) },
      }
    }
    const category = CAT.find(([re]) => re.test(text))?.[1] ?? ''
    const city = CITY.find(([re]) => re.test(text))?.[1] ?? ''
    const near = has(text, /ngoai thuong/) ? { name: 'Trường Đại học Ngoại thương', lat: 21.0227, lng: 105.8019 } : null
    if (!category && !city && !near && !has(text, /gap|\d/)) return { role: 'seeker', reply: 'Bạn muốn tìm việc gì, ở khu vực nào?' }
    const search: CapySearch = {
      keywords: [], category, city: near ? 'Hà Nội' : city, urgent: has(text, /\bgap\b/), min_pay: money(text), pay_unit: money(text) ? 'hour' : '',
      near, radius_km: 3,
    }
    return { role: 'seeker', reply: 'Mình đã lọc việc phù hợp cho bạn.', search }
  },
}
