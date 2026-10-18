import { expect, helpers, test } from './fixtures'

// Inside Zalo (?zalo=1 forces the Zalo build behaviour; the phone comes from the mock zmp-sdk).
test('Zalo login: new user, returning user, denied permission, password fallback, existing account, new employer', async ({ page: p }) => {
  const h = helpers(p)
  // Zalo uses MemoryRouter, so move with the bottom navigation instead of pushState.
  const tab = (label: string) => p.locator('nav a', { hasText: label }).locator('visible=true').first().click()
  const setPhone = (v: string) => p.evaluate((x) => sessionStorage.setItem('mock-zalo-phone', x), v)
  const openLogin = async () => { await tab('Đã ứng tuyển'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click() }
  const signOut = async () => { await tab('Tài khoản'); await p.getByRole('button', { name: 'Đăng xuất' }).click(); await p.waitForTimeout(400) }

  await p.goto('/app?zalo=1'); await h.see('Phụ bếp ca tối')
  await openLogin()
  await h.see('Zalo sẽ hỏi bạn có cho phép chia sẻ số điện thoại'); await h.see('Bạn không cần nhập mật khẩu')
  await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click(); await h.see('Điền nốt để bắt đầu'); await h.see('+84988776655')
  await expect(p.locator('#a-name')).toHaveValue('Người Dùng Zalo')
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).click(); await p.waitForTimeout(600)
  await tab('Tài khoản'); await h.see('Người Dùng Zalo')
  await signOut()

  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click(); await h.see('Chưa ứng tuyển')
  await signOut()

  await setPhone('deny')
  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click(); await h.see('Chưa lấy được số điện thoại từ Zalo')
  await p.getByRole('button', { name: 'Dùng số điện thoại và mật khẩu' }).click(); await h.see('Mật khẩu')
  await p.getByRole('button', { name: /Quay lại đăng nhập bằng Zalo/ }).click(); await h.see('Tiếp tục với Zalo')
  await p.keyboard.press('Escape')

  await setPhone('0900000001')
  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click()
  await tab('Tài khoản'); await h.see('Minh Anh')
  await signOut()

  await setPhone('0977123456')
  await tab('Việc làm'); await p.getByRole('button', { name: 'Tôi cần tuyển người' }).locator('visible=true').first().click()
  await h.see('Đăng nhập bằng Zalo'); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click(); await h.see('Tên cơ sở')
  await p.locator('#a-name').fill('Chị Hoa'); await p.locator('#a-biz').fill('Quán Hoa Cúc'); await p.locator('#a-addr').fill('12 Lê Lợi')
  await p.getByRole('button', { name: /Lưu và đăng tin/ }).click(); await p.waitForTimeout(600)
  await tab('Tài khoản'); await h.see('Quán Hoa Cúc')
})
