import { addDays, today } from '../format'
import type { Job } from '../types'
import { addUser, apps, jobs, NEW_PAY, nid, notify, reviews, users, type App } from './core'

// Only for the shared try-out site (VITE_DEMO_SHOP=1): the demo account becomes a shop AND a job seeker, with about ten people
// who applied, in different states, so the whole hiring flow can be walked through. Nothing here touches the real database.
const SHOP = '11111111-1111-4111-8111-000000000002'
const W = (n: number) => `11111111-1111-4111-8111-0000000002${String(n).padStart(2, '0')}`

// Past work for each person: [shop 0–4, stars given by that shop (0 = no-show, no review), 'late' | 'noshow']. This is what makes their rating and shift count real.
const SHOP_JOBS = ['j1', 'j4', 'j6', 'j8', 'j9']
type Past = [number, number, ('late' | 'noshow')?]
const history: Past[][] = [
  [[0, 5], [1, 5], [2, 4], [3, 5], [4, 5]],
  [[0, 5], [0, 5], [1, 4], [4, 5], [4, 4]],
  [],
  [[0, 4], [1, 5, 'late'], [3, 4]],
  [[2, 5], [4, 5]],
  [[4, 4]],
  [[0, 5], [1, 5], [2, 5], [3, 4], [4, 5], [0, 5], [2, 5]],
  [[1, 4], [3, 3, 'late'], [4, 4], [2, 3]],
  [],
  [[0, 5], [1, 4], [2, 5], [2, 5], [3, 4], [4, 0, 'noshow']],
]

/** A simple friendly face as a picture, so the cards look like real profiles (colours vary per person). */
const SKIN = ['#F1C9A5', '#E0AC83', '#F6D5B8', '#C98F63', '#EBBE96']
const HAIR = ['#2A1D14', '#4A2F1E', '#1C1410', '#6B4226', '#2A1D14']
const BG = ['#F8DDB8', '#CFE3D4', '#F5D0C8', '#CBDDF0', '#E7D9F2', '#F3E5A8']
function face(i: number, female: boolean) {
  const skin = SKIN[i % SKIN.length], hair = HAIR[i % HAIR.length], bg = BG[i % BG.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>`
    + (female ? `<path d="M22 58C14 30 30 14 50 14S86 30 78 58L78 78 22 78Z" fill="${hair}"/>` : '')
    + `<path d="M18 100C20 76 34 70 50 70S80 76 82 100Z" fill="${['#B35A24', '#5E9E52', '#3B6EA5', '#8A4520', '#C0392B'][i % 5]}"/>`
    + `<rect x="43" y="60" width="14" height="14" rx="5" fill="${skin}"/><ellipse cx="50" cy="44" rx="19" ry="22" fill="${skin}"/>`
    + (female ? `<path d="M31 42C30 26 40 20 50 20S70 26 69 42C62 34 56 30 50 30S38 34 31 42Z" fill="${hair}"/>` : `<path d="M31 40C30 24 40 19 50 19S70 24 69 40C64 32 58 29 50 29S36 32 31 40Z" fill="${hair}"/>`)
    + `<circle cx="42" cy="46" r="2.4" fill="#2A1D14"/><circle cx="58" cy="46" r="2.4" fill="#2A1D14"/><path d="M43 55Q50 61 57 55" fill="none" stroke="#7A3B2A" stroke-width="2.2" stroke-linecap="round"/>`
    + `<circle cx="38" cy="52" r="3.4" fill="#E8907C" opacity=".55"/><circle cx="62" cy="52" r="3.4" fill="#E8907C" opacity=".55"/></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
const FEMALE = new Set([0, 2, 4, 6, 8])

const people: { n: string; year: number; exp: string[]; time: string[]; bio: string; msg: string; job: 'a' | 'b'; st: App['status'] }[] = [
  { n: 'Nguyễn Thu Hà', year: 2004, exp: ['barista', 'service'], time: ['morning', 'weekend'], bio: 'Sinh viên năm 3, từng pha chế 1 năm ở quán trà sữa.', msg: 'Em làm được cả tuần buổi sáng ạ.', job: 'a', st: 'pending' },
  { n: 'Lê Minh Quân', year: 2002, exp: ['service', 'cashier'], time: ['evening', 'weekend'], bio: 'Đã làm phục vụ nhà hàng 2 năm, quen tính tiền.', msg: 'Em có thể bắt đầu từ ngày mai.', job: 'b', st: 'pending' },
  { n: 'Phạm Ngọc Anh', year: 2006, exp: ['none'], time: ['afternoon', 'weekend'], bio: 'Học sinh lớp 12, muốn đi làm thêm cuối tuần.', msg: 'Em chưa có kinh nghiệm nhưng học nhanh ạ.', job: 'b', st: 'pending' },
  { n: 'Trần Đức Huy', year: 2000, exp: ['kitchen', 'service'], time: ['morning', 'afternoon', 'evening'], bio: 'Từng phụ bếp, chịu được áp lực giờ cao điểm.', msg: 'Em rảnh cả ngày, nhận ca nào cũng được.', job: 'a', st: 'pending' },
  { n: 'Võ Thị Mai', year: 2003, exp: ['barista'], time: ['morning'], bio: 'Có chứng chỉ pha chế cơ bản.', msg: 'Em ở gần quán, đi bộ 5 phút ạ.', job: 'a', st: 'pending' },
  { n: 'Đặng Quốc Bảo', year: 2005, exp: ['sales', 'cashier'], time: ['evening'], bio: 'Từng bán hàng ở cửa hàng tiện lợi.', msg: 'Em làm được ca tối từ 5 giờ.', job: 'b', st: 'pending' },
  { n: 'Bùi Khánh Linh', year: 2001, exp: ['service', 'event'], time: ['weekend', 'evening'], bio: 'Hay làm lễ tân và phục vụ tiệc cuối tuần.', msg: 'Em xin phép làm thứ 7 và chủ nhật ạ.', job: 'b', st: 'accepted' },
  { n: 'Huỳnh Tấn Phát', year: 2004, exp: ['service'], time: ['morning', 'afternoon'], bio: 'Sinh viên, rảnh các buổi sáng trong tuần.', msg: 'Em đã làm quán cà phê gần trường.', job: 'a', st: 'accepted' },
  { n: 'Ngô Thanh Tâm', year: 2007, exp: ['none'], time: ['weekend'], bio: 'Mới 18 tuổi, đang tìm việc đầu tiên.', msg: 'Em chỉ rảnh cuối tuần thôi ạ.', job: 'a', st: 'rejected' },
  { n: 'Lý Hoàng Nam', year: 2003, exp: ['service', 'kitchen'], time: ['evening', 'weekend'], bio: 'Quen việc bếp và bưng bê, làm cẩn thận.', msg: 'Em đã làm phục vụ ở 2 quán trước đây.', job: 'b', st: 'accepted' },
]

export function seedDemoShop() {
  // the demo shop can also look for work, and runs on Pro so urgent posts work
  const shop = users[SHOP].profile
  shop.roles = ['employer', 'seeker']
  shop.plan = 'pro'
  shop.bio = 'Chủ quán cà phê, cũng đi làm thêm cuối tuần.'
  shop.birth_year = 1996
  shop.experience = ['barista', 'service']
  shop.availability = ['weekend', 'evening']

  const jobA = jobs.find((j) => j.id === 'j3')!
  const jobB: Job = { id: 'jd1', employer_id: SHOP, business_name: 'Quán Cà Phê Dùng Thử', title: 'Phục vụ bàn ca tối', description: 'Chào khách, nhận món, dọn bàn. Có bữa ăn nhẹ và tiền boa chia đều.', category: 'service', pay_amount: 30000, pay_unit: 'hour',
    start_date: today(), end_date: addDays(today(), 30), shift_note: '17:00–22:00', address: '45 Lê Lợi, Q.1', city: 'TP.HCM', lat: 10.7731, lng: 106.7006, slots: 3, is_urgent: true, filled: 0, status: 'open', created_at: new Date().toISOString() }
  jobs.unshift(jobB)
  jobA.start_date = today(); jobA.end_date = addDays(today(), 30)

  people.forEach((p, i) => {
    const id = W(i + 1)
    addUser(id, `849000002${String(i + 1).padStart(2, '0')}`, 'x-not-usable', 'seeker', p.n, { city: 'TP.HCM', birth_year: p.year, bio: p.bio, experience: p.exp as never, availability: p.time as never, avatar_path: face(i, FEMALE.has(i)) })
    const job = p.job === 'a' ? jobA : jobB
    const mins = (10 - i) * 37 // spread over the last few hours so the list looks alive
    apps.push({ id: `ad${i + 1}`, job_id: job.id, seeker_id: id, status: p.st, message: p.msg, created_at: new Date(Date.now() - mins * 60000).toISOString(), seen: p.st !== 'pending', ...NEW_PAY })
    if (p.st === 'accepted') job.filled += 1
    // finished shifts at other shops, each with a review from that shop, so rating and reliability show on the card
    history[i].forEach(([shop, stars, flag], k) => {
      const pastJob = jobs.find((j) => j.id === SHOP_JOBS[shop])!
      const pid = `ap${i + 1}_${k}`
      const at = Date.now() - (10 + k * 3) * 864e5
      const noshow = flag === 'noshow'
      apps.push({ id: pid, job_id: pastJob.id, seeker_id: id, status: 'accepted', message: null, created_at: new Date(at - 3 * 864e5).toISOString(), seen: true, ...NEW_PAY,
        pay_status: noshow ? 'refunded' : 'released', escrow_amount: 300000, platform_fee: 24000, attendance: noshow ? 'noshow' : flag === 'late' ? 'late' : 'ok', funding_mode: 'test', completed_at: at, released_at: noshow ? null : at })
      if (stars > 0) reviews.push({ id: nid(), application_id: pid, reviewer_id: pastJob.employer_id, reviewee_id: id, reviewer_role: 'employer', stars, tags: stars >= 5 ? ['hardworking', 'punctual'] : stars === 4 ? ['polite'] : [], comment: null, created_at: new Date(at).toISOString() })
    })
  })
  notify(SHOP, 'new_applicant', '7 người mới ứng tuyển', 'Xem hồ sơ và chọn người cho quán', '/app/tin-cua-toi')
}
