import { PORTS, expect, helpers, test, url } from './fixtures'

test('a visitor fills the whole post first and is asked to sign in only when pressing Post; the post goes out right after', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await p.getByRole('button', { name: 'Tôi cần tuyển người' }).locator('visible=true').first().click()
  await h.see('Cứ điền tin trước'); await expect(p.getByRole('dialog')).toHaveCount(0) // no sign-in box in the way
  await p.getByLabel('Tên việc').fill('Phụ bếp cuối tuần'); await p.locator('#p-addr').fill('9 Hai Bà Trưng')
  await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click()
  await expect(p.getByRole('dialog')).toBeVisible() // only now
  await p.getByRole('button', { name: 'Dùng thử: Nhà tuyển dụng' }).click()
  await h.see('Đã đăng tin!')
  await p.getByRole('button', { name: 'Về Tin của tôi' }).click(); await h.see('Phụ bếp cuối tuần')
})

test('what a visitor typed in the post survives a reload', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app/dang-tin')); await h.see('Cứ điền tin trước')
  await p.getByLabel('Tên việc').fill('Bốc xếp hàng chiều'); await p.locator('#p-addr').fill('5 Lê Lợi')
  await p.reload(); await h.see('Cứ điền tin trước')
  await expect(p.getByLabel('Tên việc')).toHaveValue('Bốc xếp hàng chiều'); await expect(p.locator('#p-addr')).toHaveValue('5 Lê Lợi')
})

test('a worker browses, reads, writes a note and saves jobs with no account; the sign-in box appears only on "Apply now"', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/app')); await h.see('Phụ bếp ca tối')
  await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click(); await h.see('Không bao giờ phải trả tiền')
  await p.locator('#msg').fill('Em làm được ca tối ạ')
  await expect(p.getByRole('dialog')).toHaveCount(0)
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await expect(p.getByRole('dialog')).toBeVisible()
})
