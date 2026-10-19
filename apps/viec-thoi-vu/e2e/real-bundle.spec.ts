import { PORTS, expect, helpers, test, url } from './fixtures'

// The production bundle with Supabase answered by the test: checks the real data layer (supabaseApi) end to end
// for an anonymous visitor — config, job list, reputations, job detail — without touching the real database.
const EMPLOYER = '22222222-2222-4222-8222-000000000001'
const job = {
  id: '33333333-3333-4333-8333-000000000001', employer_id: EMPLOYER, title: 'Phụ bếp thử nghiệm', description: 'Rửa rau, sơ chế',
  category: 'service', pay_amount: '35000', pay_unit: 'hour', start_date: '2026-10-20', end_date: '2026-10-25', shift_note: '17h–22h',
  address: '1 Lê Lợi', city: 'TP.HCM', lat: null, lng: null, slots: 2, filled: 0, is_urgent: true, status: 'open', created_at: '2026-10-18T00:00:00Z',
  employer: { business_name: 'Quán Thử Nghiệm', full_name: 'Chủ quán' },
}
const rep = { user_id: EMPLOYER, shifts_done: 3, on_time: 3, partners: 2, noshow: 0, late: 0, ratings: 2, avg_stars: '4.50', top_tags: [] }
const config = { payment_mode: 'off', billing: 'off', google_login: 'on', zalo_web_login: 'off', zalo_published: 'off' }

test('production bundle: anonymous visitor sees jobs, employer reputation and job detail from Supabase', async ({ page: p }) => {
  const h = helpers(p)
  const calls: string[] = []
  await p.route(/ingest\.(us\.)?sentry\.io/, (r) => r.fulfill({ status: 200, body: '{}' }))
  await p.route(/\.supabase\.co\//, async (r) => {
    const u = new URL(r.request().url())
    calls.push(r.request().method() + ' ' + u.pathname)
    const json = (body: unknown) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    if (u.pathname.endsWith('/rpc/app_config')) return json(config)
    if (u.pathname.endsWith('/rpc/role_reputations')) return json([rep])
    if (u.pathname.endsWith('/rest/v1/jobs')) {
      const single = r.request().headers()['accept']?.includes('vnd.pgrst.object')
      return json(single ? job : [job])
    }
    return json([])
  })
  await p.goto(url(PORTS.real, '/app')); await h.see('Phụ bếp thử nghiệm'); await h.see('Quán Thử Nghiệm'); await h.see('35.000đ')
  await expect(p.locator('button.job', { hasText: 'Phụ bếp thử nghiệm' }).getByText('3 ca xong')).toBeVisible()
  await p.locator('button.job', { hasText: 'Phụ bếp thử nghiệm' }).click(); await h.see('Rửa rau, sơ chế'); await h.see('4.5')
  await p.getByRole('button', { name: 'Ứng tuyển ngay' }).first().click(); await h.see('Tiếp tục với Google')
  await expect(p.locator('#a-pass')).toHaveCount(0)
  expect(calls).toContain('POST /rest/v1/rpc/app_config')
  expect(calls).toContain('POST /rest/v1/rpc/role_reputations')
})
