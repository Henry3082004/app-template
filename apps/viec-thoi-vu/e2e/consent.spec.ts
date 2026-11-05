import { PORTS, expect, helpers, test, url } from './fixtures'

test('sign-up needs the consent box ticked (never pre-ticked) and links to the terms and the privacy policy', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await p.waitForTimeout(500)
  await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  const box = p.getByLabel(/Tôi đã đọc và đồng ý/)
  await expect(box).toBeVisible(); await expect(box).not.toBeChecked()
  await expect(p.locator('.consent a[href="/dieu-khoan"]')).toBeVisible(); await expect(p.locator('.consent a[href="/bao-mat"]')).toBeVisible()
  // without the tick the form does not go through
  await p.locator('#a-name').fill('Minh Consent'); await p.locator('#a-phone').fill('0912000111'); await p.locator('#a-pass').fill('matkhau-123')
  await p.locator('form button[type=submit]').click(); await p.waitForTimeout(500)
  await expect(p.locator('#a-name')).toBeVisible()
  await box.check(); await p.locator('form button[type=submit]').click(); await p.waitForTimeout(800)
  await h.go('/app/tai-khoan'); await h.see('Minh Consent')
})

test('the first check-in asks about the location in plain words; "no" still checks in; the question is not asked again', async ({ page: p }) => {
  test.setTimeout(180_000)
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.postJob('Ca hỏi vị trí', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca hỏi vị trí' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.go('/app/ung-vien'); await h.see('Minh Anh')
  await p.locator('.card.cand', { hasText: 'Ca hỏi vị trí' }).getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.signOut()
  await h.asSeeker(); await h.go('/app/cham-cong'); await h.see('Ca hỏi vị trí')
  await p.getByRole('button', { name: 'Tôi đã đến' }).click()
  await h.see('Dùng vị trí để báo'); await h.see('không theo dõi bạn liên tục')
  await p.getByRole('button', { name: 'Không, chỉ chấm công' }).click()
  await h.see('Đã đến lúc') // the arrival is recorded without a location
})
