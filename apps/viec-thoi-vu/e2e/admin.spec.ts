import { expect, helpers, test } from './fixtures'

test('worker contests a no-show → admin settles the dispute and marks the payout paid', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.postJob('Ca tranh chấp', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca tranh chấp' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.openApplicants('Ca tranh chấp'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await p.getByRole('button', { name: 'Nạp tiền giữ chỗ' }).click(); await p.getByLabel('Tổng số giờ làm dự kiến').fill('10'); await h.see('280.000đ')
  await p.getByRole('button', { name: 'Xác nhận nạp tiền' }).click(); await h.see('Đã giữ')
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Không đến/ }).click(); await h.see('Chờ họ phản hồi'); await h.signOut()
  await h.asSeeker(); await h.see('Quán báo bạn không đến')
  await p.getByRole('button', { name: 'Không đúng, tôi có đến' }).click(); await h.see('Tiền đang được tạm giữ')

  await h.go('/app/tai-khoan'); await h.section('Tài khoản nhận tiền')
  const bank = p.locator('.card', { hasText: 'Tài khoản nhận tiền' })
  await bank.getByLabel('Ngân hàng').fill('Vietcombank'); await bank.getByLabel('Số tài khoản').fill('12ab'); await bank.getByLabel('Tên chủ tài khoản').fill('Nguyen Minh Anh')
  await bank.getByRole('button', { name: 'Lưu' }).click(); await h.see('Thông tin ngân hàng chưa đúng')
  await bank.getByLabel('Số tài khoản').fill('0123 4567 89'); await bank.getByRole('button', { name: 'Lưu' }).click(); await h.see('Đã lưu tài khoản'); await h.noHScroll()
  await h.go('/app/quan-tri'); await h.see('chỉ dành cho quản trị viên')
  await h.signOut()

  await h.asAdmin()
  await h.go('/app/quan-tri'); await h.see('Ca tranh chấp'); await h.see('Báo vắng'); await h.noHScroll()
  await expect(p.locator('.tiles.stats > div', { hasText: 'Tranh chấp chờ xử lý' }).locator('b')).toHaveText('1')
  await p.getByPlaceholder('Ghi chú quyết định').fill('Người làm có mặt'); await p.getByRole('button', { name: 'Trả cho người làm' }).click(); await h.see('Không có tranh chấp nào đang chờ')
  await p.getByRole('button', { name: /Chuyển tiền/ }).click(); await h.see('Vietcombank'); await h.see('0123456789'); await h.see('NGUYEN MINH ANH')
  await p.getByRole('button', { name: 'Đã chuyển khoản' }).click(); await h.see('Đã chuyển')
  await h.signOut()
  await h.asSeeker(); await h.see('Đã chuyển khoản cho bạn')
})

test('admin page: health tiles match the data, Sentry check reports it is off in this build', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asAdmin(); await h.go('/app/quan-tri'); await h.see('Sức khoẻ app')
  const tile = (label: string) => p.locator('.tiles.stats > div', { hasText: label }).locator('b')
  await expect(tile('Việc đang mở')).toHaveText('10')
  await expect(tile('Ứng tuyển 7 ngày')).toHaveText('1')
  await expect(tile('Tranh chấp chờ xử lý')).toHaveText('0')
  await h.noHScroll()
  await p.getByRole('button', { name: 'Gửi lỗi thử' }).click(); await h.see('Bản này chưa bật Sentry')
})

test('admin sees the sample shops and workers; other users cannot open the admin page', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asAdmin(); await h.go('/app/quan-tri')
  await p.getByRole('button', { name: 'Dữ liệu mẫu' }).click()
  await h.see('Chỉ admin thấy'); await h.see('Quán Cơm Tấm Bà Tư'); await h.see('Nguyễn Thị Lan'); await h.noHScroll()
  await h.signOut(); await h.asSeeker(); await h.go('/app/quan-tri'); await h.see('chỉ dành cho quản trị viên'); await h.notSee('Quán Cơm Tấm Bà Tư')
})

test('admin picks what the app shows: new visitor, sample shop, sample worker, admin — and can always get back', async ({ page: p }) => {
  const h = helpers(p)
  const adminLink = p.locator('.rail a[href="/app/quan-tri"], .bnav a[href="/app/quan-tri"]')
  const mode = async (name: RegExp) => { await p.getByRole('radio', { name }).click(); await p.waitForLoadState('load'); await p.waitForTimeout(700) }
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asAdmin(); await h.go('/app/tai-khoan')
  await expect(adminLink.first()).toBeAttached()
  await h.see('Chế độ xem (quản trị)')
  await expect(p.getByRole('radio', { name: /^Quản trị/ })).toHaveAttribute('aria-checked', 'true')
  // the old floating pill and toggle are gone
  await expect(p.locator('.viewbar')).toHaveCount(0); await expect(p.getByRole('button', { name: 'Chuyển sang bản người dùng thường' })).toHaveCount(0)

  // a sample worker: signed in, no admin menu, the admin page refuses
  await mode(/^Người tìm việc/)
  await h.go('/app/tai-khoan'); await h.see('Minh Anh'); await expect(adminLink).toHaveCount(0)
  await h.go('/app/quan-tri'); await h.see('chỉ dành cho quản trị viên')
  // the way back is in Account even now
  await h.go('/app/tai-khoan'); await h.see('Chế độ xem (quản trị)'); await expect(p.getByRole('radio', { name: /^Người tìm việc/ })).toHaveAttribute('aria-checked', 'true')

  // a sample shop
  await mode(/^Nhà tuyển dụng/)
  await h.go('/app/tai-khoan'); await h.see('Phê Dùng Thử'); await expect(adminLink).toHaveCount(0)

  // a new visitor: signed out, the first-visit questions come up again, and the switch is still there
  await mode(/^Người dùng mới/)
  await expect(p.getByRole('dialog').first()).toBeVisible({ timeout: 15_000 })
  await p.getByRole('button', { name: 'Để sau' }).click(); await h.see('Hoàn tất'); await p.getByRole('button', { name: /Xem việc/ }).first().click()
  await h.go('/app/tai-khoan'); await h.see('Chế độ xem (quản trị)'); await expect(p.getByRole('radio', { name: /^Người dùng mới/ })).toHaveAttribute('aria-checked', 'true')

  // and back to admin
  await mode(/^Quản trị/)
  await h.go('/app/tai-khoan'); await h.see('Công cụ admin & kiểm thử')
  await expect(adminLink.first()).toBeAttached(); await expect(p.getByRole('radio', { name: /^Quản trị/ })).toHaveAttribute('aria-checked', 'true')
})

test('only an admin can see the mode switch', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.go('/app/tai-khoan'); await h.notSee('Chế độ xem (quản trị)') // a visitor
  await h.asSeeker(); await h.go('/app/tai-khoan'); await h.notSee('Chế độ xem (quản trị)') // a worker
})
