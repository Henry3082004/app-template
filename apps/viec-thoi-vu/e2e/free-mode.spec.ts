import { PORTS, expect, helpers, test, url } from './fixtures'

// The configuration production runs today: no payments, no paid plans.
test('free mode: no pricing, no deposit, phone shown on accept, shift confirmed without money', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto(url(PORTS.free, '/gioi-thieu')); await h.see('Có mất phí không?'); await h.notSee('149.000đ')
  await h.go('/app'); await h.see('Phụ bếp ca tối')
  await h.asEmployer()
  await h.go('/app/tin-cua-toi'); await h.see('Pha chế ca sáng'); await h.notSee('Gói Miễn phí')
  for (const title of ['Tin thứ hai', 'Tin thứ ba']) {
    await h.postJob(title); await p.getByRole('button', { name: 'Về Tin của tôi' }).click(); await p.waitForTimeout(300)
  }
  await h.go('/app/bang-gia'); await p.waitForTimeout(500); expect(p.url()).not.toContain('bang-gia')
  await h.openApplicants('Pha chế ca sáng'); await h.see('Minh Anh')
  await p.getByRole('button', { name: 'Nhận', exact: true }).click(); await p.getByRole('button', { name: 'Xong' }).click()
  await h.see('bấm xác nhận để tính uy tín'); await h.notSee('Nạp tiền giữ chỗ')
  await h.signOut()
  await h.asSeeker(); await h.see('0900 000 002'); await h.see('quán sẽ xác nhận'); await h.notSee('chưa nạp tiền')
  await h.go('/app/tai-khoan'); await h.see('Uy tín của bạn'); await h.see('Tài khoản nhận tiền')
  await h.signOut()
  await h.asEmployer(); await h.openApplicants('Pha chế ca sáng')
  await p.getByRole('button', { name: 'Xác nhận đã làm xong' }).click(); await h.see('Ghi nhận hoàn thành ca'); await p.getByRole('button', { name: /Đến đủ ca/ }).click()
  await h.see('Đánh giá người làm'); await p.getByRole('radio', { name: '5' }).click(); await p.getByRole('button', { name: 'Gửi đánh giá' }).click(); await h.see('Đã xác nhận ca hoàn thành')
  await h.signOut()
  await h.asSeeker(); await h.see('Quán đã xác nhận bạn hoàn thành ca'); await h.notSee('Đang chờ chuyển khoản')
})
