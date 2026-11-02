import { PORTS, helpers, test, url } from './fixtures'

test('a finished shift costs a service fee the launch offer takes off; the admin lowers the offer and new shifts cost more', async ({ page: p }) => {
  test.setTimeout(180_000) // crosses several sign-ins
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer()
  await h.go('/app/dang-tin'); await h.see('phí dịch vụ 12.000đ'); await h.see('Ưu đãi ra mắt giảm 100%')
  await h.postJob('Ca tính phí', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca tính phí' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.go('/app/ung-vien'); await h.see('Minh Anh')
  await p.locator('.card.cand', { hasText: 'Ca tính phí' }).getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await p.locator('nav a', { hasText: 'Ca làm' }).locator('visible=true').first().click()
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')

  // the cost page: 12.000đ fee, all of it taken off, nothing charged
  await h.go('/app/chi-phi'); await h.see('Phí dịch vụ'); await h.see('Ưu đãi ra mắt −100%'); await h.see('Ứng dụng chưa thu tiền')
  await h.see('Phải trả')
  await h.signOut()

  // the admin lowers the offer to 50%
  await h.asAdmin(); await h.go('/app/quan-tri'); await h.see('Phí dịch vụ và ưu đãi')
  await p.getByLabel('Ưu đãi giảm (%)').fill('50'); await p.getByLabel('Tên ưu đãi').fill('Giảm một nửa')
  await h.see('Quán sẽ trả 6.000đ mỗi người, mỗi ca')
  await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await p.locator('.acts span', { hasText: 'Đã lưu' }).waitFor()
  await h.signOut()

  // the shop sees the new offer; the shift already finished keeps its old price
  await h.asEmployer(); await h.go('/app/chi-phi'); await h.see('Giảm một nửa −50%'); await h.see('chỉ trả 6.000đ mỗi ca')
})
