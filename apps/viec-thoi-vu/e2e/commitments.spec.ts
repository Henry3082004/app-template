import { PORTS, expect, helpers, test, url } from './fixtures'

const bell = (p: import('@playwright/test').Page) => p.locator('button.bell').locator('visible=true').first()
const nav = (p: import('@playwright/test').Page, label: string) => p.locator('nav a', { hasText: label }).locator('visible=true').first()

test('backup, "I am still coming", the shop cancelling a worker, and the worker saying "not paid"', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.postJob('Ca cam kết', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca cam kết' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()

  // the shop keeps the applicant as a backup, then takes the backup back, then accepts
  await h.asEmployer(); await h.go('/app/ung-vien')
  await h.see('Minh Anh')
  const card = p.locator('.card.cand', { hasText: 'Ca cam kết' })
  await card.getByRole('button', { name: 'Giữ dự bị' }).click(); await expect(card.getByText('Dự bị', { exact: true })).toBeVisible()
  await card.getByRole('button', { name: 'Bỏ dự bị' }).click(); await expect(card.getByRole('button', { name: 'Giữ dự bị' })).toBeVisible()
  await card.getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.signOut()

  // the worker confirms arrival; the shop hears and sees it on the card
  await h.asSeeker(); await h.go('/app/cham-cong'); await h.see('Ca cam kết')
  await p.getByRole('button', { name: 'Tôi vẫn đến' }).click(); await h.see('Đã xác nhận sẽ đến')
  await h.noHScroll(); await h.signOut()
  await h.asEmployer()
  await bell(p).click(); await h.see('xác nhận vẫn đến'); await p.keyboard.press('Escape')
  await nav(p, 'Ca làm').click(); await h.see('Đã xác nhận sẽ đến')

  // the shop cancels the worker: the worker is told and the card disappears from "Ca làm"
  await p.getByRole('button', { name: 'Hủy ca' }).click()
  await expect(p.locator('article.shiftcard', { hasText: 'Ca cam kết' })).toHaveCount(0)
  await h.signOut()
  await h.asSeeker()
  await bell(p).click(); await h.see('đã hủy ca của bạn')
})

test('a worker who was not paid can say so, and the shop is told', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.postJob('Ca chưa trả', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca chưa trả' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.go('/app/ung-vien'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).first().click(); await p.getByRole('button', { name: 'Xong' }).click()
  await nav(p, 'Ca làm').click()
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')
  await h.signOut()
  await h.asSeeker(); await h.go('/app/cham-cong'); await h.see('Ca chưa trả')
  await p.getByRole('button', { name: 'Chưa nhận được tiền' }).click(); await h.see('Đã báo quán chưa trả tiền')
  await h.signOut()
  await h.asEmployer(); await bell(p).click(); await h.see('báo chưa nhận được tiền')
})
