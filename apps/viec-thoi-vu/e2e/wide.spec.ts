import { expect, helpers, test } from './fixtures'

// Landscape tablet (1100) and desktop (1440): one centred page — top bar, banner, search card, job grid, sticky detail.
for (const [name, width, height] of [['landscape tablet', 1100, 760], ['desktop', 1440, 900]] as const) {
  test.describe(name, () => {
    test.use({ viewport: { width, height } })

    test('job list: banner, search card, grid and detail side by side', async ({ page: p }) => {
      const h = helpers(p)
      await p.goto('/app'); await h.see('Phụ bếp ca tối'); await h.noHScroll()
      // top bar (not the side rail) and a full-width banner above the search card
      await expect(p.locator('.top')).toBeVisible(); await expect(p.locator('.rail')).toBeHidden()
      const banner = (await p.locator('.banners').boundingBox())!, card = (await p.locator('.searchcard').boundingBox())!
      expect(banner.width).toBeGreaterThan(width * 0.8)
      expect(card.y).toBeGreaterThan(banner.y + banner.height / 2) // the search card floats over the banner's lower edge
      // filtering works from the search card
      await p.getByLabel('Tìm việc, cơ sở, khu vực…').fill('hải sản'); await h.see('Chưa có việc hợp ý')
      await p.getByLabel('Tìm việc, cơ sở, khu vực…').fill('')
      await p.getByRole('button', { name: 'Kho hàng', exact: true }).click(); await h.see('Soạn hàng kho mùa cao điểm'); await h.notSee('Phụ bếp ca tối')
      await p.getByRole('button', { name: 'Tất cả', exact: true }).click(); await h.see('Phụ bếp ca tối')
      // opening a job shows it in the side card with the apply button
      await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click()
      await expect(p.locator('.jdetail').getByRole('button', { name: 'Ứng tuyển ngay' })).toBeVisible()
      const detail = (await p.locator('.jdetail').boundingBox())!
      expect(detail.x + detail.width).toBeLessThanOrEqual(width)
    })

    test('other pages sit in the same centred frame', async ({ page: p }) => {
      const h = helpers(p)
      await p.goto('/app'); await h.see('Phụ bếp ca tối')
      await h.asEmployer(); await h.go('/app/tin-cua-toi'); await h.see('Tin của tôi'); await h.noHScroll()
      await h.go('/app/tai-khoan'); await h.see('Tài khoản'); await h.noHScroll()
    })
  })
}
