import { PORTS, expect, helpers, test, url } from './fixtures'

type P = import('@playwright/test').Page
const bell = (p: P) => p.locator('button.bell').locator('visible=true').first()
const nav = (p: P, label: string) => p.locator('nav a', { hasText: label }).locator('visible=true').first()

/** The shop posts a job that starts today, the worker applies, the shop accepts. Ends signed out. */
async function acceptedShift(h: ReturnType<typeof helpers>, p: P, title: string) {
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.postJob(title, true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: title }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.openApplicants(title); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).first().click(); await p.getByRole('button', { name: 'Xong' }).click(); await h.signOut()
}

test('chat between the shop and the worker, a report, and the admin handles it', async ({ page: p }) => {
  const h = helpers(p)
  await acceptedShift(h, p, 'Ca nhắn tin')

  // the shop writes
  await h.asEmployer(); await nav(p, 'Ca làm').click(); await h.see('Ca nhắn tin')
  await p.getByRole('button', { name: 'Nhắn tin' }).first().click(); await h.see('Chưa có tin nhắn')
  await p.getByLabel('Nhập tin nhắn…').fill('Chào em, mai 7h có mặt nhé'); await p.getByRole('button', { name: 'Gửi' }).click()
  await h.see('Chào em, mai 7h có mặt nhé'); await p.keyboard.press('Escape'); await h.signOut()

  // the worker is told, reads it and answers
  await h.asSeeker(); await bell(p).click(); await h.see('nhắn tin cho bạn')
  await h.go('/app/cham-cong'); await p.getByRole('button', { name: 'Nhắn tin' }).first().click(); await h.see('Chào em, mai 7h có mặt nhé')
  await p.getByLabel('Nhập tin nhắn…').fill('Dạ em đến sớm ạ'); await p.getByRole('button', { name: 'Gửi' }).click(); await h.see('Dạ em đến sớm ạ')
  await h.noHScroll(); await p.keyboard.press('Escape')
  // ... and reports the shop
  await p.getByRole('button', { name: 'Báo cáo' }).first().click(); await p.getByLabel('Mô tả thêm (không bắt buộc)').fill('Quán đòi đặt cọc')
  await p.getByRole('button', { name: 'Gửi báo cáo' }).click(); await h.see('Đã gửi báo cáo'); await p.getByRole('button', { name: 'Xong' }).click(); await h.signOut()

  // the shop sees the answer
  await h.asEmployer(); await bell(p).click(); await h.see('nhắn tin cho bạn'); await h.signOut()

  // the admin reads the report and marks it handled
  await h.asAdmin(); await h.go('/app/quan-tri')
  await p.getByRole('button', { name: /^Báo cáo/ }).click(); await h.see('Quán đòi đặt cọc'); await h.see('Lừa đảo')
  await p.getByRole('button', { name: 'Đánh dấu đã xử lý' }).click(); await h.see('Đã xử lý')
})

test('a regular is invited to another post in the app; a deletion request reaches the admin', async ({ page: p }) => {
  const h = helpers(p)
  await acceptedShift(h, p, 'Ca làm xong')
  await h.asEmployer(); await h.postJob('Việc mời lại'); await p.getByRole('button', { name: 'Về Tin của tôi' }).click()
  // finish the shift so the worker becomes a regular
  await nav(p, 'Ca làm').click()
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')
  await nav(p, 'Hồ sơ').click(); await h.section('Nhân viên quen'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Mời vào tin' }).click(); await h.see('Chọn một tin đang mở')
  await p.locator('.dlg .tx', { hasText: 'Việc mời lại' }).getByRole('button', { name: 'Mời vào tin' }).click(); await h.see('Đã gửi lời mời')
  await p.keyboard.press('Escape'); await h.signOut()

  // the worker gets the invitation and opens the job
  await h.asSeeker(); await bell(p).click(); await h.see('mời bạn làm lại')
  await p.locator('button.notif', { hasText: 'mời bạn làm lại' }).first().click(); await expect(p.getByRole('button', { name: 'Ứng tuyển ngay' }).first()).toBeVisible()
  // ... and asks to delete the account
  await nav(p, 'Hồ sơ').click(); await h.section('Xóa tài khoản')
  await p.getByLabel('Lý do (không bắt buộc)').fill('Không dùng nữa'); await p.getByRole('button', { name: 'Gửi yêu cầu xóa' }).click(); await h.see('Đã gửi yêu cầu xóa')
  await h.signOut()

  await h.asAdmin(); await h.go('/app/quan-tri')
  await p.getByRole('button', { name: /^Yêu cầu xóa/ }).click(); await h.see('Minh Anh'); await h.see('Không dùng nữa')
  await p.getByRole('button', { name: 'Đánh dấu đã xử lý' }).click(); await h.see('Đã xử lý')
})
