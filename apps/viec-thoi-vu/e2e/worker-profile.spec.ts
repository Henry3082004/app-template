import { expect, helpers, test } from './fixtures'


async function newGoogleSeeker(p: import('@playwright/test').Page, email: string, name: string) {
  const h = helpers(p)
  await p.evaluate(([e, n]) => sessionStorage.setItem('mock-google', JSON.stringify({ email: e, name: n })), [email, name])
  await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await p.getByRole('button', { name: 'Tiếp tục với Google' }).click(); await h.see('Điền nốt để bắt đầu')
  await p.locator('#c-phone').fill('0911222333'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
}

test('worker intro after first sign-in → business sees photo, age, past work and free time', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await newGoogleSeeker(p, 'lan@example.com', 'Trần Lan')
  await h.see('Giúp quán biết về bạn'); await h.noHScroll()
  const done = p.getByRole('button', { name: 'Xong', exact: true })
  await expect(done).toBeDisabled()
  const photo = await p.screenshot({ clip: { x: 0, y: 0, width: 60, height: 40 } }) // any real PNG will do
  await p.locator('.photopick input[type=file]').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: photo })
  await expect(p.getByText('Đổi ảnh')).toBeVisible()
  await expect(p.locator('.photopick .avatar img')).toBeVisible()
  await p.getByLabel('Năm sinh').selectOption('2004')
  await p.getByRole('button', { name: 'Phục vụ' }).click(); await p.getByRole('button', { name: 'Pha chế' }).click()
  // "never worked" replaces the others, picking a job again replaces "never worked"
  await p.getByRole('button', { name: 'Chưa làm bao giờ' }).click()
  await expect(p.getByRole('button', { name: 'Phục vụ' })).toHaveAttribute('aria-pressed', 'false')
  await p.getByRole('button', { name: 'Phục vụ' }).click()
  await expect(p.getByRole('button', { name: 'Chưa làm bao giờ' })).toHaveAttribute('aria-pressed', 'false')
  await p.getByRole('button', { name: 'Tối', exact: true }).click()
  await done.click(); await h.notSee('Giúp quán biết về bạn')

  // applying now goes straight through (no second question)
  await h.go('/app'); await p.locator('button.job', { hasText: 'Pha chế ca sáng' }).first().click()
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click(); await h.see('Đã gửi đơn!')
  await h.go('/app/tai-khoan'); await h.section('Thông tin cá nhân'); await h.see('Thông tin cho quán'); await expect(p.getByLabel('Năm sinh')).toHaveValue('2004')
  await h.signOut()

  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng')
  const card = p.locator('.cand', { hasText: 'Trần Lan' })
  await expect(card.getByText(`${new Date().getFullYear() - 2004} tuổi`)).toBeVisible()
  await expect(card.getByText('Phục vụ')).toBeVisible()
  await expect(card.getByText('Tối')).toBeVisible()
  await expect(card.locator('.avatar img')).toBeVisible()
  await h.noHScroll()
})

test('"Later" → asked once more on the first Apply, then never again; the application is still sent', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await newGoogleSeeker(p, 'tuan@example.com', 'Lê Tuấn')
  await h.see('Giúp quán biết về bạn'); await p.getByRole('button', { name: 'Để sau' }).click(); await h.notSee('Giúp quán biết về bạn')
  await h.go('/app'); await p.locator('button.job', { hasText: 'Pha chế ca sáng' }).first().click()
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click()
  await h.see('Quán chọn người dễ hơn khi biết chút về bạn'); await p.getByRole('button', { name: 'Để sau' }).click()
  await h.see('Đã gửi đơn!'); await p.getByRole('button', { name: 'Xem thêm việc' }).click()
  await h.go('/app'); await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click()
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click(); await h.see('Đã gửi đơn!')
  await h.notSee('Giúp quán biết về bạn')
})
