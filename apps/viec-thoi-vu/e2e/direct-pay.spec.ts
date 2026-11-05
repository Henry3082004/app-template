import { expect, helpers, test } from './fixtures'

test('direct pay can be selected instead of deposit and survives navigation', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối'); await h.asEmployer()
  await h.openApplicants('Pha chế ca sáng')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click()
  await p.getByRole('button', { name: 'Thanh toán trực tiếp sau ca', exact: true }).last().click()
  await expect(p.getByRole('button', { name: 'Nạp tiền giữ chỗ', exact: true })).toHaveCount(0)
  await h.go('/app/tai-khoan'); await h.openApplicants('Pha chế ca sáng')
  await expect(p.getByRole('button', { name: 'Xác nhận đã làm xong' })).toBeVisible()
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click()
  await p.getByRole('button', { name: /Đến đủ ca/ }).click()
  await h.see('Đánh giá người làm'); await p.keyboard.press('Escape')
  await expect(p.getByRole('button', { name: 'Đã trả tiền mặt' })).toBeVisible()
  await p.screenshot({ path: 'test-results/direct-pay.png' })
})
