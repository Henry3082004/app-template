import { PORTS, expect, helpers, test, url } from './fixtures'

test('a post asking for a deposit is held until the admin approves it', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer()
  await h.go('/app/dang-tin'); await h.see('Không thu tiền cọc')
  await p.getByLabel('Tên việc').fill('Phụ kho đặt cọc 100k')
  await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click(); await h.see('Tin đang chờ duyệt')
  await p.getByRole('button', { name: 'Về Tin của tôi' }).click(); await h.see('Chờ duyệt')
  await h.signOut()

  // nobody can see it
  await h.go('/app'); await h.see('Phụ bếp ca tối'); await h.notSee('Phụ kho đặt cọc')

  // the admin approves it from the "Tin chờ duyệt" tab
  await h.asAdmin(); await h.go('/app/quan-tri')
  await p.getByRole('button', { name: /Tin chờ duyệt/ }).click(); await h.see('Phụ kho đặt cọc')
  await p.getByRole('button', { name: 'Duyệt', exact: true }).click(); await h.see('Không có tin nào đang chờ duyệt')
  await h.signOut()
  await h.go('/app'); await h.see('Phụ kho đặt cọc 100k')
})

test('the job page warns that nobody pays to get a job', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click()
  await h.see('Không bao giờ phải trả tiền để nhận việc')
})

test('after a shift the worker answers "as posted?", can share the shift, and a lost-property report puts the shop on hold', async ({ page: p }) => {
  test.setTimeout(180_000) // a long flow that crosses five sign-ins
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.postJob('Ca đáng tin', true); await h.signOut()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Ca đáng tin' }).first().click(); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await h.see('Đã gửi đơn!'); await h.signOut()
  await h.asEmployer(); await h.go('/app/ung-vien'); await h.see('Minh Anh')
  await p.locator('.card.cand', { hasText: 'Ca đáng tin' }).getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.signOut()

  // before the shift: the share button and the safety tip are on the shift card
  await h.asSeeker(); await h.go('/app/cham-cong'); await h.see('Ca đáng tin')
  await h.see('Gửi ca cho người thân'); await h.see('Thấy không an toàn thì rời đi')
  await h.signOut()

  // the shop confirms the shift
  await h.asEmployer(); await p.locator('nav a', { hasText: 'Ca làm' }).locator('visible=true').first().click()
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await p.getByRole('button', { name: /Đến đủ ca/ }).click(); await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')
  await h.signOut()

  // the worker reviews and answers the extra question
  await h.asSeeker(); await h.go('/app/da-ung-tuyen'); await h.see('Ca đáng tin')
  await p.getByRole('button', { name: 'Đánh giá', exact: true }).first().click()
  await h.see('Công việc có đúng như tin đăng không?')
  await p.getByRole('radio', { name: '5' }).click(); await p.getByRole('button', { name: 'Đúng', exact: true }).click()
  await p.getByRole('button', { name: 'Gửi đánh giá' }).click(); await h.see('Đã đánh giá')

  // reporting lost property: the shop's open posts close
  await h.go('/app/cham-cong')
  await p.locator('article.shiftcard').getByRole('button', { name: 'Báo cáo', exact: true }).click()
  await expect(p.getByRole('dialog')).toBeVisible()
  await p.locator('#rep-reason').selectOption('lost_property'); await p.getByRole('button', { name: 'Gửi báo cáo' }).click()
  await h.signOut()
  await h.asEmployer()
  await p.locator('button.bell').locator('visible=true').first().click(); await h.see('Tài khoản đang được xác minh')
})
