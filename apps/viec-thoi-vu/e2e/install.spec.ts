import { expect, helpers, test } from './fixtures'

// Chrome fires `beforeinstallprompt` when the site is installable; headless Chromium never does, so fake it.
const fakeInstallable = () => {
  ;(window as unknown as { __prompted: number }).__prompted = 0
  const e = new Event('beforeinstallprompt') as Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
  e.prompt = async () => { (window as unknown as { __prompted: number }).__prompted++ }
  e.userChoice = Promise.resolve({ outcome: 'dismissed' })
  window.dispatchEvent(e)
}

test('suggests installing the app, one tap, and "Để sau" hides it for a while', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app'); await h.see('Phụ bếp ca tối')
  await h.notSee('Cài app về điện thoại') // nothing to offer until the browser says the site is installable
  await p.evaluate(fakeInstallable)
  await h.see('Cài app về điện thoại'); await h.noHScroll()
  await p.getByRole('button', { name: 'Cài app', exact: true }).click()
  expect(await p.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1)
  await p.evaluate(fakeInstallable); await h.see('Cài app về điện thoại')
  await p.getByRole('button', { name: 'Để sau' }).click(); await h.notSee('Cài app về điện thoại')
  await p.reload(); await h.see('Phụ bếp ca tối'); await p.evaluate(fakeInstallable); await h.notSee('Cài app về điện thoại')
})

test('never shown inside the Zalo Mini App', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/app?zalo=1'); await h.see('Phụ bếp ca tối'); await p.evaluate(fakeInstallable); await h.notSee('Cài app về điện thoại')
})

test.describe('iPhone', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' })
  test('shows a how-to instead of an install button', async ({ page: p }) => {
    const h = helpers(p)
    await p.goto('/app'); await h.see('Cài app về điện thoại')
    await p.getByRole('button', { name: 'Cách cài' }).click(); await h.see('Thêm vào MH chính')
    await p.getByRole('button', { name: 'Đã hiểu' }).click(); await h.notSee('Thêm vào MH chính')
  })
})
