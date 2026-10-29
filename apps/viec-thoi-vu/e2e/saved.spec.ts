import { expect, helpers, test } from './fixtures'

type P = import('@playwright/test').Page
const saveOn = (p: P, title: string) => p.locator('.jobwrap', { hasText: title }).first().locator('.savebtn')
const row = (p: P, title: string) => p.locator('.savedrow', { hasText: title })

test('a visitor saves jobs, compares two, removes one, then applies to all at once (already-applied ones are skipped)', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  for (const title of ['Phụ bếp ca tối', 'Pha chế ca sáng', 'Soạn hàng kho mùa cao điểm']) {
    await saveOn(p, title).click(); await expect(saveOn(p, title)).toHaveAttribute('aria-pressed', 'true')
  }
  // the "cart" next to the near-me button shows how many are saved
  await p.getByRole('link', { name: 'Việc đã lưu (3)' }).click(); await h.see('Việc đã lưu')
  await h.see('Danh sách đang lưu trên máy này'); await h.noHScroll()
  // compare two of them side by side
  await row(p, 'Phụ bếp ca tối').getByLabel('So sánh').check(); await row(p, 'Soạn hàng kho mùa cao điểm').getByLabel('So sánh').check()
  await p.getByRole('button', { name: /So sánh \(2\)/ }).click()
  const dlg = p.getByRole('dialog'); await expect(dlg).toContainText('So sánh việc'); await expect(dlg).toContainText('Lương'); await expect(dlg).toContainText('Phụ bếp ca tối'); await expect(dlg).toContainText('Soạn hàng kho mùa cao điểm')
  await h.noHScroll(); await dlg.getByRole('button', { name: 'Xong' }).click()
  // take one off the list
  await row(p, 'Soạn hàng kho mùa cao điểm').getByRole('button', { name: 'Bỏ lưu' }).click(); await expect(p.locator('.savedrow')).toHaveCount(2)
  // apply to all: sign in first, then it sends; the demo worker already applied to "Pha chế ca sáng", so that one is skipped
  await p.getByRole('button', { name: 'Ứng tuyển tất cả (2)' }).click()
  await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click()
  await h.see('Đã gửi 1 đơn ứng tuyển.'); await h.see('1 việc được bỏ qua')
  await expect(row(p, 'Phụ bếp ca tối')).toContainText('Đang chờ'); await expect(row(p, 'Pha chế ca sáng')).toContainText('Đang chờ')
  await expect(p.getByRole('button', { name: 'Ứng tuyển tất cả (0)' })).toBeDisabled()
  // signed in, the list now lives in the account and the page sits with the other worker tabs
  await expect(p.locator('nav.seg a', { hasText: 'Đã lưu' })).toHaveClass(/on/)
})
