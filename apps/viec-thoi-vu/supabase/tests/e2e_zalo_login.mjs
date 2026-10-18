import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const S = process.argv[2], B = 'http://localhost:4173'
const sizes = { phone: [390, 844], tabP: [834, 1112] }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const problems = []
let n = 0
for (const [name, [w, h]] of Object.entries(sizes)) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN', hasTouch: true, isMobile: name === 'phone' })
  const p = await ctx.newPage()
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Failed to load resource/.test(m.text())) problems.push(`[${name}] ${m.text()}`) })
  p.on('pageerror', (e) => problems.push(`[${name}] pageerror ${e.message}`))
  p.on('dialog', (d) => d.accept())
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const shot = (s) => p.screenshot({ path: `${S}/shots/e6-${name}-${String(++n).padStart(2, '0')}-${s}.png` })
  const ok = (s) => console.log(`✓ [${name}] ${s}`)
  const see = (t) => p.getByText(t, { exact: false }).locator('visible=true').first().waitFor({ timeout: 6000 })
  const tab = (label) => p.locator('nav a', { hasText: label }).locator('visible=true').first().click()
  const go = (path) => tab({ '/app/da-ung-tuyen': 'Đã ứng tuyển', '/app/tai-khoan': 'Tài khoản' }[path])
  const setPhone = (v) => p.evaluate((x) => sessionStorage.setItem('mock-zalo-phone', x), v)
  const signOut = async () => { await go('/app/tai-khoan'); await p.getByRole('button', { name: 'Đăng xuất' }).click(); await p.waitForTimeout(400) }

  await p.goto(B + '/app?zalo=1'); await see('Phụ bếp ca tối')
  // 1. new seeker via Zalo
  await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await see('Zalo sẽ hỏi bạn có cho phép chia sẻ số điện thoại'); await see('Bạn không cần nhập mật khẩu'); await shot('zalo-intro'); ok('intro explains why the phone is needed')
  await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click(); await see('Điền nốt để bắt đầu'); await see('+84988776655')
  if ((await p.locator('#a-name').inputValue()) !== 'Người Dùng Zalo') problems.push(`[${name}] name not prefilled`)
  await shot('zalo-new-user'); await p.getByRole('button', { name: 'Ứng tuyển ngay' }).click(); await p.waitForTimeout(600)
  await go('/app/tai-khoan'); await see('Người Dùng Zalo'); ok('new user created through Zalo')
  await signOut()
  // 2. same phone again → straight in, no form
  await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click(); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click()
  await see('Chưa ứng tuyển'); ok('returning user signs in with one tap')
  await signOut()
  // 3. permission denied → friendly error
  await setPhone('deny')
  await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click(); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click()
  await see('Chưa lấy được số điện thoại từ Zalo'); await shot('zalo-denied'); ok('denied permission shows a friendly message')
  // 4. fallback to password and back
  await p.getByRole('button', { name: 'Dùng số điện thoại và mật khẩu' }).click(); await see('Mật khẩu')
  await p.getByRole('button', { name: /Quay lại đăng nhập bằng Zalo/ }).click(); await see('Tiếp tục với Zalo'); ok('password fallback and back')
  await p.keyboard.press('Escape')
  // 5. existing demo account through Zalo
  await setPhone('0900000001')
  await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click(); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click()
  await go('/app/tai-khoan'); await see('Minh Anh'); ok('existing account recognised by phone')
  await signOut()
  // 6. new employer via Zalo
  await setPhone('0977123456')
  await tab('Việc làm'); await p.getByRole('button', { name: 'Tôi cần tuyển người' }).locator('visible=true').first().click(); await see('Đăng nhập bằng Zalo'); await p.getByRole('button', { name: 'Tiếp tục với Zalo' }).click(); await see('Tên cơ sở')
  await p.locator('#a-name').fill('Chị Hoa'); await p.locator('#a-biz').fill('Quán Hoa Cúc'); await p.locator('#a-addr').fill('12 Lê Lợi'); await shot('zalo-employer-form')
  await p.getByRole('button', { name: /Lưu và đăng tin/ }).click(); await p.waitForTimeout(600); await tab('Tài khoản'); await see('Quán Hoa Cúc'); ok('new employer created through Zalo')
  await ctx.close()
}
console.log('PROBLEMS:', problems.length ? '\n' + problems.join('\n') : 'none')
await b.close()
