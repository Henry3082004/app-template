import { PORTS, expect, helpers, test, url } from './fixtures'

const bell = (p: import('@playwright/test').Page) => p.locator('button.bell').locator('visible=true').first()
const nav = (p: import('@playwright/test').Page, label: string) => p.locator('nav a', { hasText: label }).locator('visible=true').first()

test('notifications, arrival / finish, cash received and the CSV statement — one shift from application to money', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  // the worker applies to a job that starts today
  await h.asEmployer(); await h.postJob('Ca chấm công', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca chấm công' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()

  // the shop is told, opens the bell, goes to the candidates and accepts
  await h.asEmployer()
  await expect(bell(p).locator('.bellbadge')).toHaveText('1')
  await bell(p).click(); await h.see('Có người ứng tuyển mới'); await h.see('Ca chấm công')
  await p.locator('button.notif', { hasText: 'Có người ứng tuyển mới' }).first().click()
  await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).first().click(); await p.getByRole('button', { name: 'Xong' }).click()
  await expect(bell(p).locator('.bellbadge')).toHaveCount(0) // opening the notification marked it read
  await h.signOut()

  // the worker is told, says "I'm here" and "I'm done"
  await h.asSeeker()
  await bell(p).click(); await h.see('đã nhận bạn')
  await h.go('/app/cham-cong'); await h.see('Ca chấm công')
  await p.getByRole('button', { name: 'Tôi đã đến' }).click(); await h.see('Đã đến lúc')
  await p.getByRole('button', { name: 'Tôi đã làm xong' }).click(); await h.see('Làm xong lúc')
  await h.noHScroll()
  await h.signOut()

  // the shop sees the arrival, confirms the shift and records the cash
  await h.asEmployer(); await nav(p, 'Ca làm').click(); await h.see('đã đến lúc'); await h.see('Làm xong lúc')
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Đã trả tiền mặt' }).click(); await h.see('Đã ghi trả tiền mặt')
  await h.signOut()

  // the worker is told and confirms getting the cash
  await h.asSeeker()
  await bell(p).click(); await h.see('Ca làm đã được xác nhận'); await h.see('đã ghi trả tiền mặt')
  await h.go('/app/cham-cong'); await h.see('Quán đã ghi trả tiền mặt')
  await p.getByRole('button', { name: 'Tôi đã nhận tiền' }).click(); await h.see('Đã nhận tiền')
  await h.signOut()

  // the shop is told, and downloads the statement
  await h.asEmployer()
  await bell(p).click(); await h.see('Người làm xác nhận đã nhận tiền')
  await p.getByRole('button', { name: 'Đánh dấu đã đọc hết' }).click()
  await expect(bell(p).locator('.bellbadge')).toHaveCount(0)
  await nav(p, 'Ca làm').click(); await h.see('Người làm xác nhận đã nhận tiền')
  await nav(p, 'Chi phí').click(); await h.see('Ca chấm công')
  const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Tải bảng kê/ }).click()])
  expect(dl.suggestedFilename()).toMatch(/^chi-phi-\d{4}-\d{2}-\d{2}\.csv$/)
})

test('guests have no bell and the notifications page asks to sign in', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await expect(p.locator('button.bell').locator('visible=true')).toHaveCount(0)
  await h.go('/app/thong-bao'); await h.see('Đăng nhập để xem')
})
