import { PORTS, expect, helpers, test, url } from './fixtures'

test('Google login: first sign-in completes the profile with a country code, returning user, employer', async ({ page: p }) => {
  const h = helpers(p)
  const setGoogle = (email: string, name: string) => p.evaluate(([e, n]) => sessionStorage.setItem('mock-google', JSON.stringify({ email: e, name: n })), [email, name])
  const openLogin = async () => { await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click() }
  const signOut = async () => { await h.go('/app/tai-khoan'); await p.getByRole('button', { name: 'Đăng xuất' }).click(); await p.waitForTimeout(400) }

  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Google' }).click()
  await h.see('Điền nốt để bắt đầu'); await h.see('ann@example.com')
  await expect(p.locator('#c-name')).toHaveValue('Ann Lee')
  const country = p.locator('select[aria-label="Quốc gia"]')
  await expect(country).toHaveValue('VN')
  await p.locator('#c-phone').fill('12'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await h.see('Số điện thoại chưa đúng')
  await country.selectOption('US'); await p.locator('#c-phone').fill('415 555 0100'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await p.waitForTimeout(600)
  await h.go('/app/tai-khoan'); await h.see('Ann Lee')
  await signOut()

  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Google' }).click(); await p.waitForTimeout(500)
  await h.go('/app/tai-khoan'); await h.see('Ann Lee')
  await signOut()

  await setGoogle('bob@example.com', 'Bob Smith')
  await h.go('/app?tuyen=1'); await p.getByRole('button', { name: 'Tiếp tục với Google' }).click()
  await h.see('Điền nốt để bắt đầu'); await h.see('Tên cơ sở')
  await p.locator('#c-phone').fill('0911000222'); await p.locator('#c-biz').fill('Bob Cafe'); await p.locator('#c-addr').fill('1 Main St')
  await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await p.waitForTimeout(600)
  await h.go('/app/tai-khoan'); await h.see('Bob Cafe')
})

test('production web login before the Zalo Mini App is public: notice + Google, no password, no dead Zalo link', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.prodBefore, '/app')); await p.waitForTimeout(500)
  await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await h.see('Đăng nhập bằng Zalo sắp có'); await expect(p.getByRole('button', { name: 'Tiếp tục với Google' })).toBeVisible()
  await expect(p.getByText('Mở trong Zalo')).toHaveCount(0)
  await expect(p.locator('#a-pass')).toHaveCount(0)
})

test('production web login after the Zalo Mini App is public: open-in-Zalo link + Google', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.prodAfter, '/app')); await p.waitForTimeout(500)
  await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await h.see('Bạn ở Việt Nam?'); await h.see('Bạn ở nước ngoài?')
  await expect(p.locator('a[href^="https://zalo.me/s/"]')).not.toHaveCount(0)
})
