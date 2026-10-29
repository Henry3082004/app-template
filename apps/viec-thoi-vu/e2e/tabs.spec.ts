import { PORTS, expect, helpers, test, url } from './fixtures'

const nav = (p: import('@playwright/test').Page, label: string) => p.locator('nav a', { hasText: label }).locator('visible=true').first()

test('worker menu: Việc làm · Chấm công · Thu nhập · Hồ sơ, with empty states and a locked Rút tiền', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await expect(p.locator('nav a', { hasText: 'Thu nhập' })).toHaveCount(0) // visitors keep the short menu
  await h.asSeeker()
  for (const label of ['Việc làm', 'Chấm công', 'Thu nhập', 'Hồ sơ']) await expect(nav(p, label)).toBeVisible()
  await expect(p.locator('nav a', { hasText: 'Trang chủ' })).toHaveCount(0)
  // Việc làm is where a worker lands: banner, search and the jobs
  await nav(p, 'Việc làm').click(); await h.see('Phụ bếp ca tối'); await expect(p.getByLabel('Tìm việc, cơ sở, khu vực…')).toBeVisible()
  // Chấm công: nothing accepted yet, applications are one tab away
  await nav(p, 'Chấm công').click(); await h.see('Chưa có ca nào'); await h.noHScroll()
  await p.getByRole('link', { name: 'Đơn ứng tuyển' }).click(); await h.see('Đang chờ')
  await p.getByRole('link', { name: 'Ca làm' }).click(); await h.see('Chưa có ca nào')
  // Thu nhập
  await nav(p, 'Thu nhập').click(); await h.see('Số dư hiện tại'); await h.see('Thu nhập tháng này'); await h.see('Chưa phát sinh giao dịch'); await h.noHScroll()
  const cash = p.getByRole('button', { name: /Rút tiền/ }).first()
  await expect(cash).toBeDisabled(); await expect(cash).toContainText('Sắp có')
  await p.getByRole('tab', { name: 'Bảng kê lương' }).click()
  // Hồ sơ: the new rows
  await nav(p, 'Hồ sơ').click(); await h.see('Xác thực tài khoản'); await h.see('Cài đặt & Bảo mật'); await h.see('Hỗ trợ & HDSD'); await h.see('Tài khoản nhận tiền')
  await h.section('Hỗ trợ & HDSD'); await h.see('Khi nào được trả công?')
})

test('a finished shift shows in Chấm công (Đã xong) and in Thu nhập (transactions + monthly statement)', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await p.getByRole('button', { name: 'Nạp tiền giữ chỗ' }).click(); await p.getByLabel('Tổng số giờ làm dự kiến').fill('10')
  await p.getByRole('button', { name: 'Xác nhận nạp tiền' }).click(); await h.see('Đã giữ')
  await h.signOut()
  // accepted and funded: the shift is listed with the shop's phone
  await h.asSeeker(); await nav(p, 'Chấm công').click(); await h.see('Pha chế ca sáng'); await h.see('0900 000 002')
  await h.signOut()
  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng')
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm')
  await h.signOut()
  await h.asSeeker()
  await nav(p, 'Chấm công').click(); await h.see('Đã xong'); await h.see('Pha chế ca sáng')
  await nav(p, 'Thu nhập').click()
  await h.see('Giao dịch'); await h.see('+'); await h.see('Pha chế ca sáng'); await h.see('Quán Cà Phê Dùng Thử'); await h.notSee('Chưa phát sinh giao dịch')
  await expect(p.locator('.tiles.stats').getByText('1', { exact: true })).toBeVisible() // 1 shift done
  await p.getByRole('tab', { name: 'Bảng kê lương' }).click(); await h.see('Tháng'); await h.see('1 ca')
  await h.noHScroll()
})

test('free mode: income is a cash estimate and says so', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.signOut()
  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng')
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm')
  await h.signOut()
  await h.asSeeker(); await nav(p, 'Thu nhập').click()
  await h.see('Quán trả tiền mặt trực tiếp'); await h.see('ước tính'); await h.see('Quán trả trực tiếp'); await h.see('Số dư hiện tại')
})

test('"Việc gần tôi" is one clear button next to the job count, and toggles sorting by distance', async ({ page: p, context }) => {
  const h = helpers(p)
  await context.grantPermissions(['geolocation']); await context.setGeolocation({ latitude: 10.7769, longitude: 106.7009 })
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.see('việc đang tuyển')
  const near = p.getByRole('button', { name: 'Việc gần tôi' })
  await expect(near).toHaveAttribute('aria-pressed', 'false')
  await near.click(); await expect(near).toHaveAttribute('aria-pressed', 'true')
  await near.click(); await expect(near).toHaveAttribute('aria-pressed', 'false')
  await h.noHScroll()
})
