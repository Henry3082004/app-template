import { expect, helpers, test } from './fixtures'

const nav = (p: import('@playwright/test').Page, label: string) => p.locator('nav a', { hasText: label }).locator('visible=true').first()

test('shop menu: Tuyển người · Ca làm · Chi phí · Hồ sơ, from candidate to paid shift', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer()
  for (const label of ['Tuyển người', 'Ca làm', 'Chi phí', 'Hồ sơ']) await expect(nav(p, label)).toBeVisible()
  // empty states first
  await nav(p, 'Ca làm').click(); await h.noHScroll()
  await nav(p, 'Chi phí').click(); await h.see('Chi tháng này'); await h.see('Chưa có khoản chi nào'); await h.noHScroll()
  // Tuyển người: posts tab and candidates tab (everyone waiting, all posts together)
  await nav(p, 'Tuyển người').click(); await h.see('Tin đăng')
  await p.getByRole('link', { name: /Ứng viên/ }).click(); await h.see('Minh Anh'); await h.see('Pha chế ca sáng')
  await p.getByRole('button', { name: 'Nhận', exact: true }).first().click(); await p.getByRole('button', { name: 'Xong' }).click()
  // the accepted worker is now in Ca làm, and the post can be reposted
  await nav(p, 'Ca làm').click(); await h.see('Minh Anh'); await h.see('Pha chế ca sáng')
  await p.getByRole('button', { name: 'Nạp tiền giữ chỗ' }).click(); await p.getByRole('button', { name: 'Xác nhận nạp tiền' }).click(); await h.see('Đã giữ')
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm')
  await p.keyboard.press('Escape')
  await nav(p, 'Chi phí').click(); await h.see('Minh Anh'); await h.notSee('Chưa có khoản chi nào')
  await p.getByRole('tab', { name: 'Theo tháng' }).click(); await h.see('1 ca')
  // Hồ sơ: the worker who finished is a regular, with an invite button
  await nav(p, 'Hồ sơ').click(); await h.section('Nhân viên quen'); await h.see('Mời làm lại'); await h.see('Tăng độ tin cậy với ứng viên')
})

test('free mode: the shop records the cash payment and the spend page shows it', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('http://localhost:4174/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.signOut()
  await h.asEmployer(); await nav(p, 'Ca làm').click()
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Đã trả tiền mặt' }).click(); await h.see('Đã ghi trả tiền mặt')
  await nav(p, 'Chi phí').click(); await h.see('ước tính'); await h.see('Đã trả')
})
