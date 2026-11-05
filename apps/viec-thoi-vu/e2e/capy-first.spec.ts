import { expect, helpers, test } from './fixtures'

test.use({ quizSeen: false })

test('a recruiting visitor can answer Capi by tapping a suggested reply', async ({ page: p }) => {
  await p.goto('/app')
  await p.getByRole('button', { name: 'Tuyển người cho quán' }).click()
  await p.getByRole('button', { name: /Nhờ Capi soạn tin giúp/ }).click()
  const panel = p.getByRole('dialog', { name: 'Capi' })
  await panel.getByPlaceholder('Nhập yêu cầu của bạn…').fill('Xin chào')
  await panel.getByRole('button', { name: 'Gửi' }).click()
  await expect(panel.getByRole('button', { name: 'Phụ bếp', exact: true })).toBeVisible()
  await panel.getByRole('button', { name: 'Phụ bếp', exact: true }).click()
  await expect(panel.locator('.cbub.me').last()).toHaveText('Phụ bếp')
  await expect(panel.getByPlaceholder('Nhập yêu cầu của bạn…')).toBeEditable()
  await expect(panel.getByRole('button', { name: 'Phụ bếp', exact: true })).toHaveCount(1)
})

test('first visit: a visitor who says they need staff is offered to let Capi write the post, and the draft opens in the form with no sign-in', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Bạn đến đây để…')
  await p.getByRole('button', { name: 'Tuyển người cho quán' }).click()
  await h.see('Hoàn tất'); await h.see('Nhờ Capi soạn tin giúp'); await h.see('Tự đăng tin')
  await p.getByRole('button', { name: /Nhờ Capi soạn tin giúp/ }).click()
  const panel = p.getByRole('dialog', { name: 'Capi' })
  await expect(panel).toContainText('Bạn cần tuyển mấy người') // the shop's helper, though nobody is signed in
  await panel.getByPlaceholder('Nhập yêu cầu của bạn…').fill('cần thêm 3 người phụ bếp tối mai'); await panel.getByRole('button', { name: 'Gửi' }).click()
  await expect(panel.locator('.capydraft')).toContainText('Cần 3 phụ bếp')
  await panel.getByRole('button', { name: 'Mở để chỉnh và đăng' }).click()
  await h.see('Cứ điền tin trước'); await expect(p.locator('#p-title')).toHaveValue('Cần 3 phụ bếp')
  await expect(p.getByRole('dialog')).toHaveCount(0) // still no sign-in box
})
