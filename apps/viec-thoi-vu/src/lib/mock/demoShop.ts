import { addDays, today } from '../format'
import type { Job } from '../types'
import { addUser, apps, jobs, NEW_PAY, notify, users, type App } from './core'

// Only for the shared try-out site (VITE_DEMO_SHOP=1): the demo account becomes a shop AND a job seeker, with about ten people
// who applied, in different states, so the whole hiring flow can be walked through. Nothing here touches the real database.
const SHOP = '11111111-1111-4111-8111-000000000002'
const W = (n: number) => `11111111-1111-4111-8111-0000000002${String(n).padStart(2, '0')}`

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
    addUser(id, `849000002${String(i + 1).padStart(2, '0')}`, 'x-not-usable', 'seeker', p.n, { city: 'TP.HCM', birth_year: p.year, bio: p.bio, experience: p.exp as never, availability: p.time as never })
    const job = p.job === 'a' ? jobA : jobB
    const mins = (10 - i) * 37 // spread over the last few hours so the list looks alive
    apps.push({ id: `ad${i + 1}`, job_id: job.id, seeker_id: id, status: p.st, message: p.msg, created_at: new Date(Date.now() - mins * 60000).toISOString(), seen: p.st !== 'pending', ...NEW_PAY })
    if (p.st === 'accepted') job.filled += 1
  })
  notify(SHOP, 'new_applicant', '7 người mới ứng tuyển', 'Xem hồ sơ và chọn người cho quán', '/app/tin-cua-toi')
}
