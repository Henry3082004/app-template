import type { CapyPose } from './capy'
import type { Highlights, Locale, Role } from './types'

/**
 * The slides on top of the job list. Three kinds are mixed so the page feels alive:
 *  - stat: real numbers counted from the database (shown only when big enough to be worth saying: never invented),
 *  - news: article links the admin chose (app_settings `home_news`), opened in a new tab,
 *  - tip: fixed advice for workers and shops.
 * `tone` picks the colour (t1–t4 in app.css), `to` is an in-app link, `href` an outside link.
 */
export type SlideKind = 'stat' | 'news' | 'tip'
export type Audience = 'both' | 'worker' | 'shop'
export interface Slide {
  id: string; kind: SlideKind; audience: Audience; tone: 't1' | 't2' | 't3' | 't4'; pose: CapyPose
  tag: string; title: string; sub: string; cta?: string; to?: string; href?: string
}

type Copy = { tag: string; title: string; sub: string; cta?: string }
interface Tip { id: string; audience: Audience; tone: Slide['tone']; pose: CapyPose; to?: string; copy: Record<Locale, Copy> }

const TIPS: Tip[] = [
  {
    id: 'profile', audience: 'worker', tone: 't2', pose: 'wave', to: '/app/tai-khoan',
    copy: {
      vi: { tag: 'Mẹo cho người tìm việc', title: 'Hồ sơ đầy đủ, được nhận nhanh hơn', sub: 'Thêm ảnh, năm sinh và việc đã làm để quán thấy bạn đáng tin hơn.', cta: 'Hoàn thiện hồ sơ' },
      en: { tag: 'Tip for job seekers', title: 'A complete profile gets accepted faster', sub: 'Add a photo, birth year and past work so shops trust you sooner.', cta: 'Complete profile' },
    },
  },
  {
    id: 'hire', audience: 'shop', tone: 't3', pose: 'urgent', to: '/app?tuyen=1',
    copy: {
      vi: { tag: 'Dành cho quán', title: 'Cần người gấp? Đăng tin trong 1 phút', sub: 'Mô tả ca làm, chọn mức lương, nhận đơn ứng tuyển ngay trong ngày.', cta: 'Đăng tin tuyển' },
      en: { tag: 'For shops', title: 'Need staff fast? Post in 1 minute', sub: 'Describe the shift, set the pay, get applications the same day.', cta: 'Post a job' },
    },
  },
  {
    id: 'trust', audience: 'both', tone: 't4', pose: 'bath',
    copy: {
      vi: { tag: 'Uy tín', title: 'Làm xong ca, hai bên đánh giá nhau', sub: 'Đi làm đúng giờ, uy tín của bạn tăng dần và lần sau dễ được chọn hơn.' },
      en: { tag: 'Trust', title: 'After each shift, both sides review each other', sub: 'Show up on time and your reputation grows, so you get picked more often.' },
    },
  },
  {
    id: 'found', audience: 'worker', tone: 't1', pose: 'cheer', to: '/app/tai-khoan',
    copy: {
      vi: { tag: 'Mẹo cho người tìm việc', title: 'Bật "Cho quán tìm thấy tôi" để được mời', sub: 'Quán chỉ thấy tên rút gọn và uy tín, không thấy số điện thoại của bạn.', cta: 'Vào Hồ sơ' },
      en: { tag: 'Tip for job seekers', title: 'Switch on "Let shops find me" to get invited', sub: 'Shops only see a shortened name and your reputation, never your phone number.', cta: 'Open profile' },
    },
  },
  {
    id: 'checkin', audience: 'both', tone: 't2', pose: 'wave',
    copy: {
      vi: { tag: 'Cách làm việc', title: 'Đến nơi bấm "Tôi đã đến", xong ca bấm xác nhận', sub: 'Quán biết bạn đã tới, bạn có bằng chứng đã làm. Hai bên nhắn tin ngay trong app.' },
      en: { tag: 'How it works', title: 'Tap "I\'m here" on arrival, confirm when done', sub: 'The shop knows you arrived and you have proof you worked. Chat inside the app.' },
    },
  },
]

const STAT_MIN = 3 // a number below this is not worth a headline

/** Slides built from the real numbers; each only when the number is big enough. */
function stats(h: Highlights, locale: Locale, catName: (c: string) => string): Slide[] {
  const vi = locale === 'vi'
  const out: Slide[] = []
  if (h.open_jobs >= STAT_MIN) out.push({ id: 'st-open', kind: 'stat', audience: 'worker', tone: 't1', pose: 'cheer',
    tag: vi ? 'Đang diễn ra' : 'Right now', title: vi ? `${h.open_jobs} việc đang mở, ứng tuyển ngay` : `${h.open_jobs} open jobs, apply now`,
    sub: vi ? 'Cập nhật theo tin quán vừa đăng. Chọn việc gần bạn và ứng tuyển 1 chạm.' : 'Updated as shops post. Pick a job near you and apply in one tap.' })
  if (h.new_jobs_7d >= STAT_MIN) out.push({ id: 'st-new', kind: 'stat', audience: 'both', tone: 't3', pose: 'wave',
    tag: vi ? 'Mới trong tuần' : 'New this week', title: vi ? `${h.new_jobs_7d} tin tuyển mới trong 7 ngày qua` : `${h.new_jobs_7d} new posts in the last 7 days`,
    sub: vi ? 'Thị trường việc thời vụ đang chuyển động mỗi ngày.' : 'The short-term job market moves every day.' })
  if (h.top_city && h.top_city.n >= STAT_MIN) out.push({ id: 'st-city', kind: 'stat', audience: 'both', tone: 't4', pose: 'urgent',
    tag: vi ? 'Xu hướng khu vực' : 'Area trend', title: vi ? `${h.top_city.name} đang có nhiều việc nhất` : `${h.top_city.name} has the most openings`,
    sub: vi ? `${h.top_city.n} việc đang mở tại ${h.top_city.name}. Quán ở đây nên đăng sớm để được chọn người tốt.` : `${h.top_city.n} open jobs in ${h.top_city.name}. Shops there should post early.` })
  if (h.top_category && h.top_category.n >= STAT_MIN) out.push({ id: 'st-cat', kind: 'stat', audience: 'both', tone: 't2', pose: 'cheer',
    tag: vi ? 'Ngành đang cần người' : 'Trade in demand', title: vi ? `Ngành ${catName(h.top_category.name).toLowerCase()} đang cần nhiều người` : `${catName(h.top_category.name)} is hiring the most`,
    sub: vi ? `${h.top_category.n} tin đang mở trong ngành này.` : `${h.top_category.n} open posts in this trade.` })
  if (h.urgent_jobs >= 1) out.push({ id: 'st-urgent', kind: 'stat', audience: 'worker', tone: 't1', pose: 'urgent',
    tag: vi ? 'Gấp' : 'Urgent', title: vi ? `${h.urgent_jobs} việc cần người gấp` : `${h.urgent_jobs} jobs need people urgently`,
    sub: vi ? 'Lọc "Gấp" để xem ngay các việc quán cần người sớm nhất.' : 'Use the "Urgent" filter to see them first.' })
  if (h.ready_workers >= STAT_MIN) out.push({ id: 'st-ready', kind: 'stat', audience: 'shop', tone: 't3', pose: 'wave', to: '/app?tuyen=1',
    tag: vi ? 'Cho quán' : 'For shops', title: vi ? `${h.ready_workers} người đang sẵn sàng nhận việc` : `${h.ready_workers} people are ready to work`,
    sub: vi ? 'Đăng tin hoặc vào "Tìm người" để mời họ.' : 'Post a job or open "Find people" to invite them.', cta: vi ? 'Đăng tin tuyển' : 'Post a job' })
  return out
}

function news(h: Highlights, locale: Locale): Slide[] {
  const vi = locale === 'vi'
  return h.news.map((n, i) => ({ id: `news-${i}`, kind: 'news' as const, audience: 'both' as const, tone: (i % 2 ? 't3' : 't2') as Slide['tone'], pose: 'wave' as const,
    tag: vi ? 'Tin tức thị trường' : 'Market news', title: n.title, sub: [n.sub, n.source && (vi ? `Nguồn: ${n.source}` : `Source: ${n.source}`)].filter(Boolean).join(' · '),
    cta: vi ? 'Đọc bài' : 'Read', href: n.url }))
}

/** All slides, varied: stat → news → tip → stat … (what suits the signed-in side goes first inside each kind). */
export function buildSlides(h: Highlights | undefined, locale: Locale, role: Role | undefined, catName: (c: string) => string, max = 8): Slide[] {
  const rank = (s: Slide) => (s.audience === 'both' || !role ? 0 : (s.audience === 'shop') === (role === 'employer') ? -1 : 1)
  const byRelevance = (a: Slide, b: Slide) => rank(a) - rank(b)
  const tips: Slide[] = TIPS.map((t) => ({ id: t.id, kind: 'tip', audience: t.audience, tone: t.tone, pose: t.pose, to: t.to, ...t.copy[locale] }))
  const lists = [h ? stats(h, locale, catName) : [], h ? news(h, locale) : [], tips].map((l) => [...l].sort(byRelevance))
  const out: Slide[] = []
  for (let i = 0; out.length < max && lists.some((l) => i < l.length); i++) {
    for (const l of lists) if (i < l.length && out.length < max) out.push(l[i])
  }
  return out
}
