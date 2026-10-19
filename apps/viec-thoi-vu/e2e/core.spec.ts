import { expect, helpers, test } from './fixtures'

test('seeker: browse, apply, see and withdraw the application, account, language, sign out', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối'); await h.noHScroll()
  await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click(); await h.see('Mô tả công việc'); await h.noHScroll()
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click(); await h.see('Ứng tuyển ngay 👋')
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!')
  await p.getByRole('button', { name: 'Xem đơn đã gửi' }).click(); await h.see('Đang chờ'); await h.noHScroll()
  await p.getByRole('button', { name: 'Rút đơn' }).first().click(); await h.see('Đã rút')
  await h.go('/app/tai-khoan'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'English' }).first().click(); await h.see('Language')
  await p.getByRole('button', { name: 'Tiếng Việt' }).first().click()
  await p.getByRole('button', { name: 'Đăng xuất' }).click(); await h.see('Tôi cần tuyển người')
})

test('employer (paid plans on): post, free-plan limit, accept applicant, phone shown, pricing', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.go('/app?tuyen=1'); await h.see('Tạo hồ sơ cơ sở')
  await p.getByRole('button', { name: 'Dùng thử: Nhà tuyển dụng' }).click(); await h.see('Đăng tin')
  await h.postJob('Phục vụ ca chiều'); await h.noHScroll()
  await p.getByRole('button', { name: 'Về Tin của tôi' }).click(); await h.see('2/2 tin đang mở')
  await h.go('/app/dang-tin'); await h.see('Đã điền theo tin trước')
  await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click(); await h.see('Gói Miễn phí chỉ mở được 2 tin')
  await h.openApplicants('Pha chế ca sáng'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click(); await h.see('Chốt')
  await p.getByRole('button', { name: 'Xong' }).click(); await h.see('0900 000 001')
  await h.go('/app/bang-gia'); await p.getByRole('button', { name: 'Nâng cấp Pro' }).click(); await h.see('Thanh toán đang được mở'); await h.noHScroll()
})

test('public pages: landing and terms', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/dieu-khoan'); await h.see('Điều khoản sử dụng'); await h.noHScroll()
  await h.go('/'); await h.see('nhận việc trong ngày'); await h.noHScroll()
  // the header spacer once picked up the progress-bar style (class clash on .bar) and showed as a big green pill
  await expect(p.locator('header.bar .sp')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})
