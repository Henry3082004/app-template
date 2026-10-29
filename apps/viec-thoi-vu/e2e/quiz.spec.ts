import { expect, helpers, test } from './fixtures'

test.use({ quizSeen: false })

test('first open: a few quick taps are asked, matching jobs come first, and it is never asked again', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Vài câu hỏi nhanh'); await h.see('Bạn đến đây để…'); await h.noHScroll()
  await p.getByRole('button', { name: 'Tìm việc làm thêm' }).click()
  await h.see('Bạn muốn làm ở đâu?'); await p.getByRole('button', { name: 'TP.HCM', exact: true }).click()
  await h.see('Bạn thích làm việc gì?'); await expect(p.getByRole('button', { name: 'Bỏ qua câu này' })).toBeVisible()
  const quiz = p.locator('.quiz')
  await quiz.getByRole('button', { name: 'Phục vụ', exact: true }).click(); await quiz.getByRole('button', { name: 'Gì cũng được' }).click()
  await expect(quiz.getByRole('button', { name: 'Phục vụ', exact: true })).toHaveAttribute('aria-pressed', 'false') // "anything" stands alone
  await quiz.getByRole('button', { name: 'Phục vụ', exact: true }).click(); await p.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await h.see('Bạn thường rảnh lúc nào?'); await p.getByRole('button', { name: 'Tối', exact: true }).click(); await p.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await h.see('Bạn từng làm việc gì chưa?'); await p.getByRole('button', { name: 'Bỏ qua câu này' }).click()
  await h.see('Hoàn tất'); await p.getByRole('button', { name: 'Xem việc hợp với bạn' }).click()
  // TP.HCM + service jobs are marked and come first
  const first = p.locator('button.job').first()
  await expect(first.getByText('Hợp với bạn')).toBeVisible(); await expect(first).toContainText('TP.HCM')
  await p.reload(); await h.see('Phụ bếp ca tối'); await p.waitForTimeout(500); await h.notSee('Bạn đến đây để…')
})

test('"Later" counts as done; a business skips the worker questions and is offered to post', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Bạn đến đây để…')
  await p.getByRole('button', { name: 'Để sau' }).click(); await h.see('Hoàn tất')
  await p.getByRole('button', { name: 'Xem việc hợp với bạn' }).click()
  await p.reload(); await h.see('Phụ bếp ca tối'); await p.waitForTimeout(500); await h.notSee('Bạn đến đây để…')
  // a fresh visitor who runs a shop
  await p.evaluate(() => localStorage.removeItem('vtv-quiz')); await p.reload(); await h.see('Bạn đến đây để…')
  await p.getByRole('button', { name: 'Tuyển người cho quán' }).click()
  await h.see('Hoàn tất'); await h.see('Đăng tin chỉ mất 1 phút')
  await p.getByRole('button', { name: 'Đăng tin tuyển' }).click(); await h.see('Tên cơ sở')
})

test('a question added later is asked on its own; the worker intro is pre-filled from the answers', async ({ page: p }) => {
  const h = helpers(p)
  await p.addInitScript(() => localStorage.setItem('vtv-quiz', JSON.stringify({ device: 'aaaaaaaa-e2e0-4000-8000-000000000001', answers: { goal: 'seeker', city: 'Hà Nội', cats: ['event'], time: ['weekend'] }, synced: null })))
  await p.goto('/app'); await h.see('Bạn từng làm việc gì chưa?'); await h.notSee('Bạn muốn làm ở đâu?')
  await expect(p.locator('.qsteps i')).toHaveCount(1)
  await p.getByRole('button', { name: 'Pha chế', exact: true }).click(); await p.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await h.see('Hoàn tất'); await p.getByRole('button', { name: 'Xem việc hợp với bạn' }).click()
  // first sign-in: the worker intro already has "Pha chế" and "Cuối tuần" picked
  await p.evaluate(() => sessionStorage.setItem('mock-google', JSON.stringify({ email: 'quiz@example.com', name: 'Quiz Test' })))
  await h.go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await p.getByRole('button', { name: 'Tiếp tục với Google' }).click(); await h.see('Điền nốt để bắt đầu')
  await p.locator('#c-phone').fill('0911222444'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await h.see('Giúp quán biết về bạn')
  await expect(p.getByRole('button', { name: 'Pha chế', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(p.getByRole('button', { name: 'Cuối tuần' })).toHaveAttribute('aria-pressed', 'true')
})

test('admin can take the questions again from Account; others have no such button', async ({ page: p }) => {
  const h = helpers(p)
  await p.addInitScript(() => localStorage.setItem('vtv-quiz', JSON.stringify({ device: 'aaaaaaaa-e2e0-4000-8000-000000000002', answers: { goal: null, city: null, cats: null, time: null, exp: null }, synced: null })))
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.asSeeker(); await h.go('/app/tai-khoan'); await h.see('Vai trò'); await h.notSee('Làm thử bộ câu hỏi'); await h.signOut()
  await h.asAdmin(); await h.go('/app/tai-khoan')
  await p.getByRole('button', { name: 'Làm thử bộ câu hỏi' }).click()
  await h.see('Chế độ thử (admin)'); await h.see('Bạn đến đây để…')
  await p.getByRole('button', { name: 'Tìm việc làm thêm' }).click(); await h.see('Bạn muốn làm ở đâu?')
  await p.getByRole('button', { name: 'Để sau' }).click(); await h.see('Hoàn tất')
  await p.getByRole('button', { name: 'Xem việc hợp với bạn' }).click()
  await h.go('/app/tai-khoan'); await p.getByRole('button', { name: 'Làm thử bộ câu hỏi' }).click(); await h.see('Bạn đến đây để…') // again and again
})
