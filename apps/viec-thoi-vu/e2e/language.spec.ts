import { helpers, test } from './fixtures'

test.use({ locale: 'en-US' })

test('opens in Vietnamese even on an English browser; English sticks once chosen', async ({ page: p }) => {
  const h = helpers(p)
  await p.goto('/'); await h.see('nhận việc trong ngày')
  await p.getByRole('button', { name: 'EN', exact: true }).first().click(); await h.see('start today')
  await p.reload(); await h.see('start today')
})
