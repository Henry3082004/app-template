import { expect, helpers, test } from './fixtures'

test('banner: real numbers first, moves on by itself every 3 s, dots and arrows browse, the jobs sit below it', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  const dots = p.locator('.bn-dots button')
  await expect(dots).toHaveCount(8)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await h.see('việc đang mở, ứng tuyển ngay') // a number counted from the real job list
  // moves to slide 2 (a news article) without any click
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 6000 })
  await h.see('Tin tức thị trường')
  const read = p.getByRole('link', { name: /Đọc bài/ })
  await expect(read).toHaveAttribute('target', '_blank'); await expect(read).toHaveAttribute('rel', /noopener/); await expect(read).toHaveAttribute('href', /^https:\/\//)
  // dots and arrows jump around; it loops from the last back to the first
  await dots.nth(7).click(); await expect(dots.nth(7)).toHaveAttribute('aria-current', 'true')
  await p.emulateMedia({ reducedMotion: 'reduce' }) // stops the timer, as for people who asked for less motion, so the next checks are steady
  await p.locator('.bn-arrow.next').evaluate((b: HTMLElement) => b.click()); await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await p.locator('.bn-arrow.prev').evaluate((b: HTMLElement) => b.click()); await expect(dots.nth(7)).toHaveAttribute('aria-current', 'true')
  // the banner is above the job list
  const banner = await p.locator('.banners').boundingBox(), firstJob = await p.locator('button.job').first().boundingBox()
  expect(banner!.y + banner!.height).toBeLessThanOrEqual(firstJob!.y)
  await h.noHScroll()
})

test('banner: it waits while held, can be dragged with the mouse, follows reduced motion, and a call-to-action opens the right page', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  const dots = p.locator('.bn-dots button')
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await expect(p.locator('.bn-pause')).toHaveCount(0) // there is no pause button
  // holding the banner (finger or mouse down) keeps it on the same slide for longer than 3 s
  const box = (await p.locator('.bn-track').boundingBox())!
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down()
  await p.waitForTimeout(4000)
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  await p.mouse.up()
  // drag left = next slide, drag right = back (timer off so the checks are steady)
  await p.emulateMedia({ reducedMotion: 'reduce' })
  const swipe = async (from: number, to: number) => {
    const y = box.y + box.height / 2
    await p.mouse.move(box.x + from, y); await p.mouse.down(); await p.mouse.move(box.x + (from + to) / 2, y, { steps: 4 }); await p.mouse.move(box.x + to, y, { steps: 4 }); await p.mouse.up()
  }
  await swipe(box.width * 0.8, box.width * 0.3); await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true')
  await swipe(box.width * 0.3, box.width * 0.8); await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  // a short drag snaps back
  await swipe(box.width * 0.5, box.width * 0.45); await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true')
  // motion allowed again: it moves on by itself
  await p.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 6000 })
  // the tip's button goes to the right place
  await dots.nth(2).click(); await p.getByRole('link', { name: /Hoàn thiện hồ sơ/ }).click(); await h.see('Đăng nhập')
})

test('a shop can add its logo, shown on the Account page', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.go('/app/tai-khoan'); await h.section('Thông tin cá nhân'); await h.see('Thêm logo / ảnh quán')
  const photo = await p.screenshot({ clip: { x: 0, y: 0, width: 60, height: 40 } })
  await p.locator('.photopick input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: photo })
  await h.see('Đổi logo / ảnh quán'); await expect(p.locator('.photopick .avatar.sq img')).toHaveCount(1)
})
