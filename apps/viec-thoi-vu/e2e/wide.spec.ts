import { expect, helpers, test } from './fixtures'

// Landscape tablet (1100) and desktop (1440): menu on the left, title + today on top, greeting, banner, search card, job rows;
// desktop also keeps the open job in a sticky card on the right.
for (const [name, width, height] of [['landscape tablet', 1100, 760], ['desktop', 1440, 900]] as const) {
  test.describe(name, () => {
    test.use({ viewport: { width, height } })

    test('job list: banner, search card, grid and detail side by side', async ({ page: p }) => {
      const h = helpers(p)
      await p.goto('/app'); await h.see('Phụ bếp ca tối'); await h.noHScroll()
      // the menu down the left, the page title and today's date on top
      await expect(p.locator('.rail .navlabel')).toBeVisible(); await expect(p.locator('.top')).toContainText(/\d{2}\/\d{2}\/\d{4}/)
      await h.see('Xin chào'); await h.see('Việc làm cho bạn')
      const banner = (await p.locator('.banners').boundingBox())!, card = (await p.locator('.searchcard').boundingBox())!
      expect(banner.width).toBeGreaterThan((width - 264) * 0.8)
      expect(card.y).toBeGreaterThan(banner.y + banner.height / 2) // the search card floats over the banner's lower edge
      // filtering works from the search card
      await p.getByLabel('Tìm việc, cơ sở, khu vực…').fill('hải sản'); await h.see('Chưa có việc phù hợp')
      await p.getByLabel('Tìm việc, cơ sở, khu vực…').fill('')
      await p.getByRole('button', { name: 'Kho hàng', exact: true }).click(); await h.see('Soạn hàng kho mùa cao điểm'); await h.notSee('Phụ bếp ca tối')
      await p.getByRole('button', { name: 'Tất cả', exact: true }).click(); await h.see('Phụ bếp ca tối')
      // opening a job: desktop shows it in the side card, a landscape tablet on its own page
      await p.locator('button.job', { hasText: 'Phụ bếp ca tối' }).first().click()
      if (width >= 1280) {
        await expect(p.locator('.jdetail').getByRole('button', { name: 'Ứng tuyển ngay' })).toBeVisible()
        const detail = (await p.locator('.jdetail').boundingBox())!
        expect(detail.x + detail.width).toBeLessThanOrEqual(width)
      } else {
        await expect(p.getByRole('button', { name: 'Ứng tuyển ngay' }).first()).toBeVisible(); await h.see('Quay lại')
      }
    })

    test('other pages sit in the same centred frame', async ({ page: p }) => {
      const h = helpers(p)
      await p.goto('/app'); await h.see('Phụ bếp ca tối')
      await h.asEmployer(); await h.go('/app/tin-cua-toi'); await h.see('Tuyển người'); await h.noHScroll()
      await h.go('/app/tai-khoan'); await h.see('Uy tín của bạn'); await h.noHScroll()
    })
  })
}
