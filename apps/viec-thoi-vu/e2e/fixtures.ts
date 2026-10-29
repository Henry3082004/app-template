import { test as base, expect, type Page } from '@playwright/test'

export const PORTS = { testPay: 4173, free: 4174, prodBefore: 4175, prodAfter: 4176, real: 4177 } as const
export const url = (port: number, path: string) => `http://localhost:${port}${path}`

/** Helpers shared by every flow. All navigation inside the app is client-side so the in-memory mock keeps its state. */
export function helpers(p: Page) {
  const see = (text: string) => expect(p.getByText(text, { exact: false }).locator('visible=true').first()).toBeVisible()
  const notSee = async (text: string) => {
    await p.waitForTimeout(300)
    await expect(p.getByText(text, { exact: false }).locator('visible=true')).toHaveCount(0)
  }
  const go = (path: string) => p.evaluate((x) => { history.pushState({}, '', x); dispatchEvent(new PopStateEvent('popstate')) }, path)
  const noHScroll = async () => expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  const signOut = async () => { await go('/app/tai-khoan'); await p.getByRole('button', { name: 'Đăng xuất' }).click(); await see('Tôi cần tuyển người') }
  const asEmployer = async () => {
    await go('/app?tuyen=1'); await p.getByRole('button', { name: 'Dùng thử: Nhà tuyển dụng' }).click(); await see('Tuyển người'); await p.waitForTimeout(400)
  }
  const asSeeker = async () => {
    await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
    await p.getByRole('button', { name: 'Dùng thử: Người tìm việc' }).click(); await p.waitForTimeout(500)
  }
  const asAdmin = async () => {
    await go('/app/da-ung-tuyen'); await p.getByRole('button', { name: 'Đăng nhập' }).first().click()
    if (await p.locator('#a-name').count()) await p.getByRole('button', { name: /Đã có tài khoản/ }).click()
    await p.locator('#a-phone').fill('0900000003'); await p.locator('#a-pass').fill('quan-tri-thu-1')
    await p.locator('form button[type=submit]').click(); await p.waitForTimeout(600)
  }
  const openApplicants = async (title: string) => { await go('/app/tin-cua-toi'); await p.locator('button.job', { hasText: title }).first().click() }
  const postJob = async (title: string, startToday = false) => {
    await go('/app/dang-tin'); await see('Đăng tin'); await p.getByLabel('Tên việc').fill(title)
    if (startToday) await p.getByLabel('Bắt đầu').fill(new Date().toISOString().slice(0, 10))
    await p.getByRole('button', { name: 'Đăng tin', exact: true }).last().click(); await see('Đã đăng tin!')
  }
  /** Account page rows open in place: open one (no-op if it is open already) */
  const section = async (title: string) => {
    const row = p.locator('details.arow', { has: p.locator('summary', { hasText: title }) })
    if (await row.getAttribute('open') === null) await row.locator('summary').click()
  }
  return { see, notSee, go, noHScroll, signOut, asEmployer, asSeeker, asAdmin, openApplicants, postJob, section }
}

/** Every test fails if the page logs an error/warning or throws; Google Fonts are blocked like in the sandbox. */
// Most tests start as someone who already answered the quick questions; the quiz tests turn this off.
const QUIZ_DONE = JSON.stringify({ device: 'aaaaaaaa-e2e0-4000-8000-000000000000', answers: { goal: null, city: null, cats: null, time: null, exp: null }, synced: null })

// Capy says hello (fly-in + speech bubble) once per tab; most tests skip it so the bubble never covers what they click.
export const test = base.extend<{ problems: string[]; quizSeen: boolean; capyHello: boolean }>({
  quizSeen: [true, { option: true }],
  capyHello: [false, { option: true }],
  problems: [async ({ page, quizSeen, capyHello }, use) => {
    if (!capyHello) await page.context().addInitScript(() => sessionStorage.setItem('vtv-capy-hi', '1'))
    if (quizSeen) await page.context().addInitScript((v) => { if (!localStorage.getItem('vtv-quiz')) localStorage.setItem('vtv-quiz', v) }, QUIZ_DONE)
    const problems: string[] = []
    const watch = (p: Page) => {
      p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Failed to load resource/.test(m.text())) problems.push(m.text()) })
      p.on('pageerror', (e) => problems.push('pageerror ' + e.message))
      p.on('dialog', (d) => d.accept())
    }
    await page.context().route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    watch(page)
    page.context().on('page', watch)
    await use(problems)
    expect(problems, 'console errors / page errors').toEqual([])
  }, { auto: true }],
})
export { expect }
