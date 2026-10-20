import { expect, helpers, test } from './fixtures'

test('banner on top of the job list moves on by itself every 3 s, can be browsed, and the jobs sit below it', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  const dots = p.locator('.bn-dots button')
  await expect(dots).toHaveCount(4)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await h.see('Cuối năm, việc thời vụ nhiều hơn')
  // moves to slide 2 without any click
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 6000 })
  // tapping a dot jumps to that slide, and the call-to-action there is a normal link
  await dots.nth(2).click(); await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true')
  await h.see('Cần người gấp? Đăng tin trong 1 phút')
  // the banner is above the job list
  const banner = await p.locator('.banners').boundingBox(), firstJob = await p.locator('button.job').first().boundingBox()
  expect(banner!.y + banner!.height).toBeLessThanOrEqual(firstJob!.y)
  await h.noHScroll()
})

test('hovering stops the banner; its call-to-action opens the right page', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  const dots = p.locator('.bn-dots button')
  await p.locator('.banners').hover()
  await p.waitForTimeout(4000)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true') // still on the first slide
  await dots.nth(1).click(); await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
  await p.getByRole('link', { name: /Hoàn thiện hồ sơ/ }).click(); await h.see('Đăng nhập')
})

test('a shop can add its logo, shown on the Account page', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.go('/app/tai-khoan'); await h.see('Thêm logo / ảnh quán')
  const photo = await p.screenshot({ clip: { x: 0, y: 0, width: 60, height: 40 } })
  await p.locator('.photopick input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: photo })
  await h.see('Đổi logo / ảnh quán'); await expect(p.locator('.photopick .avatar.sq img')).toHaveCount(1)
})
