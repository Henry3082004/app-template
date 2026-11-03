import { PORTS, expect, helpers, test, url } from './fixtures'

test.use({ tourSeen: false })

test('first visit: a short guide lights the search box, a job, the shifts tab and Capi, then never shows again', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.see('Tìm việc nhanh'); await expect(p.locator('.tourhole')).toBeVisible()
  await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await h.see('Bấm vào một việc')
  await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await h.see('Theo dõi ca làm')
  await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await h.see('Hỏi Capi')
  await p.getByRole('button', { name: 'Bắt đầu thôi' }).click(); await expect(p.locator('.tour')).toHaveCount(0)
  await p.reload(); await h.see('Phụ bếp ca tối'); await p.waitForTimeout(1800); await expect(p.locator('.tour')).toHaveCount(0)
})

test('"Skip" ends the guide at once, and Account can show it again', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Tìm việc nhanh')
  await p.getByRole('button', { name: 'Bỏ qua' }).click(); await expect(p.locator('.tour')).toHaveCount(0)
  await h.asSeeker(); await h.go('/app/tai-khoan'); await p.getByText('Xem lại các bước chính').click()
  await p.getByRole('button', { name: 'Xem lại hướng dẫn' }).click(); await h.see('Tìm việc nhanh')
})

test('a shop sees the guide on its own page: post a job, confirm shifts, ask Capi', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await p.getByRole('button', { name: 'Bỏ qua' }).click()
  await h.asEmployer(); await h.go('/app/tin-cua-toi')
  await h.see('Đăng tin tuyển người'); await expect(p.locator('.tourhole')).toBeVisible()
  await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await h.see('Xác nhận ca làm')
  await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await h.see('Nhờ Capi soạn tin')
  await p.getByRole('button', { name: 'Bắt đầu thôi' }).click(); await expect(p.locator('.tour')).toHaveCount(0)
})
