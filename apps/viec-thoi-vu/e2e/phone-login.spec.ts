import { expect, helpers, PORTS, test, url } from './fixtures'

for (const port of [PORTS.prodBefore, PORTS.prodAfter]) {
  test(`production ${port}: phones enter Mini App through QR, tablets only show email`, async ({ page: p }, info) => {
    const h = helpers(p)
    await p.goto(url(port, '/app')); await p.waitForTimeout(500)
    await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
    await expect(p.getByRole('button', { name: 'Tiếp tục với Google' })).toBeVisible()
    await expect(p.locator('#a-phone, #a-pass')).toHaveCount(0)
    const qr = p.getByRole('img', { name: 'Mã QR mở Mini App Capi' })
    const link = p.getByRole('link', { name: 'Mở Capi trong Zalo' })
    if (info.project.name === 'phone') {
      await expect(qr).toBeVisible()
      await expect(link).toHaveAttribute('href', 'https://zalo.me/s/2847107362388346804/')
    } else { await expect(qr).toHaveCount(0); await expect(link).toHaveCount(0) }
    await h.noHScroll()
    await p.screenshot({ path: `test-results/login-${port}-${info.project.name}.png` })
  })
}
