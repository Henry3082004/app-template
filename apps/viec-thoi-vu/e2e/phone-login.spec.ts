import { expect, helpers, PORTS, test, url } from './fixtures'

test('production web: phone + password sign-up and sign-in sit next to Google, the typed number is flagged as not verified', async ({ page: p }) => {
  const h = helpers(p)
  const later = () => p.getByRole('button', { name: 'Để sau' }).click({ timeout: 2500 }).catch(() => undefined)
  const openLogin = async () => { await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click() }
  await p.goto(url(PORTS.prodBefore, '/app')); await p.waitForTimeout(500)
  await openLogin()
  await h.see('Dùng số điện thoại'); await expect(p.getByRole('button', { name: 'Tiếp tục với Google' })).toBeVisible(); await expect(p.locator('#a-pass')).toHaveCount(0)
  // create an account with a phone number
  await p.getByRole('button', { name: 'Tạo tài khoản bằng số điện thoại' }).click()
  await h.see('chưa xác thực'); await expect(p.locator('#a-pass')).toBeVisible(); await h.noHScroll()
  await p.locator('#a-name').fill('Lan Test'); await p.locator('#a-phone').fill('0912345678'); await p.locator('#a-pass').fill('matkhau-123')
  await p.locator('form button[type=submit]').click(); await p.waitForTimeout(800)
  await later() // a new seeker is asked once for a photo and past work: skip it
  await h.go('/app/tai-khoan'); await h.see('Lan Test')
  await h.signOut()
  // sign in again: wrong password is refused, the right one works; "back" returns to the choice
  await openLogin()
  await p.getByRole('button', { name: 'Đăng nhập bằng số điện thoại' }).click(); await expect(p.locator('#a-name')).toHaveCount(0)
  await p.locator('#a-phone').fill('0912345678'); await p.locator('#a-pass').fill('sai-mat-khau'); await p.locator('form button[type=submit]').click(); await h.see('Sai số điện thoại hoặc mật khẩu')
  await p.getByRole('button', { name: /Chọn cách đăng nhập khác/ }).click(); await h.see('Dùng số điện thoại'); await expect(p.locator('#a-pass')).toHaveCount(0)
  await p.getByRole('button', { name: 'Đăng nhập bằng số điện thoại' }).click()
  await p.locator('#a-phone').fill('0912345678'); await p.locator('#a-pass').fill('matkhau-123'); await p.locator('form button[type=submit]').click(); await p.waitForTimeout(800)
  await h.go('/app/tai-khoan'); await h.see('Lan Test')
})
