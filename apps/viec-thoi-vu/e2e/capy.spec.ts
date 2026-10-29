import { expect, helpers, test } from './fixtures'

test('a job seeker chats with Capy: the request becomes real results, "see all" filters the list', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await p.getByRole('button', { name: 'Hỏi Capy' }).click()
  const panel = p.getByRole('dialog', { name: 'Capy' })
  await expect(panel).toContainText('Bạn muốn tìm việc gì')
  await expect(panel).toContainText('Capy dùng AI nên có thể sai')
  // a suggestion chip sends the sentence; Capy answers from the real list (demo shop jobs in Ho Chi Minh City, pay per hour)
  await panel.getByPlaceholder('Nhập yêu cầu của bạn…').fill('tìm việc phục vụ ở sài gòn trên 30 nghìn một giờ'); await panel.getByRole('button', { name: 'Gửi' }).click()
  await expect(panel).toContainText('Có 2 việc phù hợp'); await expect(panel).toContainText('Phụ bếp ca tối'); await expect(panel).toContainText('Phục vụ bàn cuối tuần')
  await expect(panel).not.toContainText('Pha chế ca sáng') // 28.000đ is under the asked minimum
  // save from the chat: the cart in the menu counts it
  await panel.locator('.capyjob .savebtn').first().click(); await expect(p.locator('nav a', { hasText: 'Đã lưu' }).locator('visible=true').first().locator('.navbadge')).toHaveText('1')
  await h.noHScroll()
  // a place Capy knows: nothing open there, and it says so
  await panel.getByPlaceholder('Nhập yêu cầu của bạn…').fill('việc phục vụ gần trường Ngoại thương'); await panel.getByRole('button', { name: 'Gửi' }).click()
  await expect(panel).toContainText('Chưa có việc đang mở khớp yêu cầu này')
  // a broad ask has many results (4 shown); "see all" filters the main list the same way, with a chip to clear it
  await panel.getByPlaceholder('Nhập yêu cầu của bạn…').fill('tìm việc lương 20 nghìn một giờ'); await panel.getByRole('button', { name: 'Gửi' }).click()
  await expect(panel).toContainText('Có 10 việc phù hợp')
  await panel.getByRole('button', { name: 'Xem tất cả (10)' }).click()
  await h.see('Capy đang lọc'); await expect(p.getByRole('dialog', { name: 'Capy' })).toHaveCount(0)
  await p.getByRole('button', { name: 'Bỏ lọc' }).first().click(); await h.notSee('Capy đang lọc')
})

test('a shop tells Capy what it needs and gets a draft post to check and publish (gender requirement dropped)', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer(); await h.go('/app/tin-cua-toi'); await h.see('Tin đăng')
  await p.getByRole('button', { name: 'Hỏi Capy' }).click()
  const panel = p.getByRole('dialog', { name: 'Capy' })
  await expect(panel).toContainText('Bạn cần tuyển mấy người')
  await panel.getByPlaceholder('Nhập yêu cầu của bạn…').fill('cần thêm 3 người phụ bếp, nữ nhanh nhẹn vì mai là rằm'); await panel.getByRole('button', { name: 'Gửi' }).click()
  await expect(panel).toContainText('Mình đã bỏ yêu cầu về giới tính');
  await expect(panel.locator('.capydraft')).toContainText('Cần 3 phụ bếp'); await expect(panel.locator('.capydraft')).toContainText('Chưa có lương')
  await panel.getByRole('button', { name: 'Mở để chỉnh và đăng' }).click()
  // the post form is filled from the draft, the previous post does not overwrite it
  await h.see('Capy đã soạn bản nháp')
  await expect(p.locator('#p-title')).toHaveValue('Cần 3 phụ bếp')
  await expect(p.locator('#p-pay')).toHaveValue('')
  await expect(p.locator('#p-slots')).toHaveValue('3')
  // pay is missing: publishing asks for it, then works
  await p.locator('#p-addr').fill('12 Nguyễn Huệ')
  await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click(); await h.see('Vui lòng nhập mức lương')
  await p.locator('#p-pay').fill('35000'); await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click(); await h.see('Đã đăng tin!')
})

test.describe('Capy in the corner', () => {
  test.use({ capyHello: true })
  test('says hello on the first visit, can be dragged anywhere and stays there, a tap opens the chat', async ({ page: p }) => {
    const h = helpers(p)
    await p.goto('/app'); await h.see('Phụ bếp ca tối')
    const say = p.getByRole('button', { name: /Mình có thể giúp gì cho bạn/ })
    await expect(say).toBeVisible()
    const me = p.getByRole('button', { name: 'Hỏi Capy' })
    await expect(me).toBeVisible()
    await p.waitForTimeout(1000) // the fly-in has landed
    const a = (await me.boundingBox())!
    const vp = p.viewportSize()!
    expect(a.x + a.width).toBeGreaterThan(vp.width - 120) // starts in the bottom-right corner
    // drag it to the top-left part of the screen
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down()
    await p.mouse.move(a.x - 40, a.y - 60, { steps: 4 }); await p.mouse.move(80, 200, { steps: 6 }); await p.mouse.up()
    await expect(say).toHaveCount(0) // dragging hides the hello
    await expect(p.getByRole('dialog', { name: 'Capy' })).toHaveCount(0) // a drag is not a tap
    const b = (await me.boundingBox())!
    expect(Math.abs(b.x + b.width / 2 - 80)).toBeLessThan(6); expect(Math.abs(b.y + b.height / 2 - 200)).toBeLessThan(6)
    // the place is kept after reload, and no second hello in the same tab
    await p.reload(); await h.see('Phụ bếp ca tối')
    const c = (await me.boundingBox())!
    expect(Math.abs(c.x - b.x)).toBeLessThan(4); expect(Math.abs(c.y - b.y)).toBeLessThan(4)
    await expect(say).toHaveCount(0)
    await me.click()
    await expect(p.getByRole('dialog', { name: 'Capy' })).toContainText('Bạn muốn tìm việc gì')
    await h.noHScroll()
  })
})
