import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
const S = process.argv[2], B = 'http://localhost:4173', P = 'http://localhost:4175'
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
  const shot = (s) => p.screenshot({ path: `${S}/shots/e7-${name}-${String(++n).padStart(2, '0')}-${s}.png` })
  const ok = (s) => console.log(`✓ [${name}] ${s}`)
  const see = (t) => p.getByText(t, { exact: false }).locator('visible=true').first().waitFor({ timeout: 6000 })
  const go = (path) => p.evaluate((x) => { history.pushState({}, '', x); dispatchEvent(new PopStateEvent('popstate')) }, path)
  const setG = (email, nm) => p.evaluate(([e, n2]) => sessionStorage.setItem('mock-google', JSON.stringify({ email: e, name: n2 })), [email, nm])
  const signOut = async () => { await go('/app/tai-khoan'); await p.getByRole('button', { name: 'Đăng xuất' }).click(); await p.waitForTimeout(400) }
  const openLogin = async () => { await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click() }

  await p.goto(B + '/app'); await see('Phụ bếp ca tối')
  // 1. first Google sign-in → finish profile
  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Google' }).click()
  await see('Điền nốt để bắt đầu'); await see('ann@example.com'); await shot('complete')
  if ((await p.locator('#c-name').inputValue()) !== 'Ann Lee') problems.push(`[${name}] name not prefilled from Google`)
  await p.locator('#c-phone').fill('14155550100'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await see('Số điện thoại chưa đúng'); ok('phone without country code rejected')
  await p.locator('#c-phone').fill('+1 415 555 0100'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await p.waitForTimeout(600)
  await go('/app/tai-khoan'); await see('Ann Lee'); ok('first Google sign-in creates the profile')
  await signOut()
  // 2. same Google account → straight in
  await openLogin(); await p.getByRole('button', { name: 'Tiếp tục với Google' }).click(); await p.waitForTimeout(500)
  await go('/app/tai-khoan'); await see('Ann Lee'); ok('returning Google user signs in directly')
  await signOut()
  // 3. employer via Google (role remembered from the button they pressed)
  await setG('bob@example.com', 'Bob Smith')
  await go('/app?tuyen=1'); await p.getByRole('button', { name: 'Tiếp tục với Google' }).click()
  await see('Điền nốt để bắt đầu'); await see('Tên cơ sở'); await shot('complete-employer')
  await p.locator('#c-phone').fill('0911000222'); await p.locator('#c-biz').fill('Bob Cafe'); await p.locator('#c-addr').fill('1 Main St'); await p.getByRole('button', { name: 'Tiếp tục', exact: true }).click(); await p.waitForTimeout(600)
  await go('/app/tai-khoan'); await see('Bob Cafe'); ok('employer via Google keeps business details')
  await ctx.close()

  // 4. production-style web dialog (no password): Zalo for Vietnamese, Google for the rest
  const ctx2 = await b.newContext({ viewport: { width: w, height: h }, locale: 'vi-VN', hasTouch: true, isMobile: name === 'phone' })
  const q = await ctx2.newPage()
  await q.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  q.on('pageerror', (e) => problems.push(`[${name}] prod pageerror ${e.message}`))
  await q.goto(P + '/app'); await q.waitForTimeout(500)
  await q.evaluate(() => { history.pushState({}, '', '/app/da-ung-tuyen'); dispatchEvent(new PopStateEvent('popstate')) })
  await q.getByRole('button', { name: 'Đăng nhập' }).first().click()
  await q.getByText('Bạn ở Việt Nam?').first().waitFor({ timeout: 6000 }); await q.getByText('Bạn ở nước ngoài?').first().waitFor({ timeout: 6000 })
  if (await q.locator('#a-pass').count()) problems.push(`[${name}] password field must not exist in production auth`)
  await q.screenshot({ path: `${S}/shots/e7-${name}-prod-dialog.png` }); ok('production dialog: Zalo + Google, no password')
  await ctx2.close()
}
console.log('PROBLEMS:', problems.length ? '\n' + problems.join('\n') : 'none')
await b.close()
