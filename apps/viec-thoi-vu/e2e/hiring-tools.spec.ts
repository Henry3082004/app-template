import { PORTS, expect, helpers, test, url } from './fixtures'

test('job guide reaches only the accepted worker; both sides agree to the shift terms', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer()
  await h.go('/app/dang-tin'); await h.see('Miễn phí cho quán và người làm đến')
  await p.getByLabel('Tên việc').fill('Ca có hướng dẫn'); await p.getByLabel('Bắt đầu').fill(new Date().toISOString().slice(0, 10))
  await p.locator('#p-guide').fill('Mặc áo đen, đến sớm 15 phút, hỏi chị Lan.')
  await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click(); await h.see('Đã đăng tin!')
  await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca có hướng dẫn' }).first().click(); await h.notSee('hỏi chị Lan')
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.go('/app/ung-vien'); await h.see('Minh Anh')
  await p.locator('.card.cand', { hasText: 'Ca có hướng dẫn' }).getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.signOut()

  // the worker gets the guide as a notification and on the shift card, and agrees
  await h.asSeeker()
  await p.locator('button.bell').locator('visible=true').first().click(); await h.see('Hướng dẫn công việc'); await p.keyboard.press('Escape')
  await h.go('/app/cham-cong'); await h.see('Ca có hướng dẫn'); await h.see('hỏi chị Lan'); await h.see('Thỏa thuận ca')
  await p.getByRole('button', { name: 'Tôi đồng ý' }).click(); await h.see('Bạn đã đồng ý')
  await h.signOut()

  // the shop is told and agrees too
  await h.asEmployer()
  await p.locator('button.bell').locator('visible=true').first().click(); await h.see('xác nhận thỏa thuận ca'); await p.keyboard.press('Escape')
  await p.locator('nav a', { hasText: 'Ca làm' }).locator('visible=true').first().click(); await h.see('Thỏa thuận ca')
  await p.getByRole('button', { name: 'Tôi đồng ý' }).click(); await h.see('Cả hai bên đã đồng ý')
})

test('referral card: my code, and a code cannot be my own', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asSeeker(); await h.go('/app/tai-khoan')
  await h.section('Giới thiệu bạn bè'); await h.see('Mã của bạn')
  const code = (await p.locator('.refcode').innerText()).trim()
  expect(code).toMatch(/^[A-Z0-9]{6}$/)
  await p.getByPlaceholder('Nhập mã của bạn bè').fill(code); await p.getByRole('button', { name: 'Dùng mã' }).click(); await h.see('mã của chính bạn')
})
