import { expect, helpers, test } from './fixtures'

test('first sign-in asks "You\'re here to…", pre-selected from the button pressed, and can be changed', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await p.evaluate(() => sessionStorage.setItem('mock-google', JSON.stringify({ email: 'mai@example.com', name: 'Chị Mai' })))
  await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await p.getByRole('button', { name: 'Tiếp tục với Google' }).click(); await h.see('Điền nốt để bắt đầu'); await h.see('Bạn đến đây để…')
  const seeker = p.getByRole('radio', { name: /Tìm việc làm thêm/ }), employer = p.getByRole('radio', { name: /Tuyển người cho quán/ })
  await expect(seeker).toHaveAttribute('aria-checked', 'true')
  await h.noHScroll()
  await employer.click(); await expect(employer).toHaveAttribute('aria-checked', 'true'); await h.see('Tên cơ sở')
  await p.locator('#c-phone').fill('0911333444'); await p.locator('#c-biz').fill('Tiệm Chè Mai'); await p.locator('#c-addr').fill('5 Hai Bà Trưng')
  await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await p.waitForTimeout(600)
  await h.notSee('Giúp quán biết về bạn') // businesses are not asked worker questions
  await h.go('/app/tai-khoan'); await h.see('Tiệm Chè Mai'); await h.section('Vai trò'); await h.see('Tạo thêm hồ sơ tìm việc')
})

test('a worker adds a business profile, posts, switches back — and cannot apply to their own job', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asSeeker(); await h.go('/app/tai-khoan'); await h.section('Vai trò')
  await p.getByRole('button', { name: 'Tạo thêm hồ sơ tuyển người' }).click(); await h.see('Hồ sơ quán của bạn')
  await p.getByRole('button', { name: 'Tạo hồ sơ quán' }).click() // empty form: browser asks for the name
  await p.locator('#r-biz').fill('Quầy Nước Minh Anh'); await p.locator('#r-addr').fill('9 Nguyễn Huệ')
  await p.getByRole('button', { name: 'Tạo hồ sơ quán' }).click(); await h.see('Chi phí')
  await h.postJob('Phụ quầy nước'); await p.getByRole('button', { name: 'Về Tin của tôi' }).click()
  await h.go('/app/tai-khoan'); await h.section('Vai trò'); await h.see('Đang dùng')
  await p.getByRole('button', { name: 'Tìm việc làm thêm' }).click(); await h.see('Phụ bếp ca tối')
  await p.locator('button.job', { hasText: 'Phụ quầy nước' }).first().click()
  await h.see('Đây là tin đăng của bạn'); await expect(p.getByRole('button', { name: 'Ứng tuyển ngay' })).toHaveCount(0)
  // in business mode, someone else's job offers a one-tap switch to apply
  await h.go('/app/tai-khoan'); await h.section('Vai trò'); await p.getByRole('button', { name: 'Tuyển người cho quán' }).click(); await h.see('Chi phí')
  await h.go('/app/viec/j1'); await h.see('Phụ bếp ca tối') // a shared job link
  await p.getByRole('button', { name: 'Chuyển sang tìm việc để ứng tuyển' }).click()
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click(); await h.see('Đã gửi đơn!')
})

test('a business adds the worker role: asked about themselves, then can apply elsewhere', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.go('/app/tai-khoan'); await h.section('Vai trò')
  await p.getByRole('button', { name: 'Tạo thêm hồ sơ tìm việc' }).click()
  await h.see('Giúp quán biết về bạn'); await h.see('Vài chạm là xong')
  await p.getByLabel('Năm sinh').selectOption('1995'); await p.getByRole('button', { name: 'Pha chế' }).click()
  await p.getByRole('button', { name: 'Xong', exact: true }).click(); await h.notSee('Giúp quán biết về bạn')
  await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click()
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click(); await h.see('Đã gửi đơn!')
})
