import type { CapyPose } from './capy'
import type { Locale } from './types'

/**
 * Slides of the banner at the top of the job list. Edit this list to change what people see:
 * `tone` picks the colour (t1–t4 in app.css), `to` is an in-app link (leave out for no button).
 * Keep claims general and true — no numbers we can't back up.
 */
export interface BannerSlide {
  id: string
  tone: 't1' | 't2' | 't3' | 't4'
  pose: CapyPose
  to?: string
  copy: Record<Locale, { tag: string; title: string; sub: string; cta?: string }>
}

export const BANNERS: BannerSlide[] = [
  {
    id: 'season', tone: 't1', pose: 'cheer',
    copy: {
      vi: { tag: 'Xu hướng', title: 'Cuối năm, việc thời vụ nhiều hơn', sub: 'Quán ăn, kho hàng, siêu thị cần thêm người dịp cao điểm. Ứng tuyển sớm để được chọn.' },
      en: { tag: 'Trending', title: 'More seasonal jobs towards year-end', sub: 'Restaurants, warehouses and shops add staff at peak time. Apply early to get picked.' },
    },
  },
  {
    id: 'profile', tone: 't2', pose: 'wave', to: '/app/tai-khoan',
    copy: {
      vi: { tag: 'Mẹo', title: 'Hồ sơ đầy đủ, được nhận nhanh hơn', sub: 'Thêm ảnh, năm sinh và việc đã làm để quán thấy bạn đáng tin hơn.', cta: 'Hoàn thiện hồ sơ' },
      en: { tag: 'Tip', title: 'A complete profile gets accepted faster', sub: 'Add a photo, birth year and past work so shops trust you sooner.', cta: 'Complete profile' },
    },
  },
  {
    id: 'hire', tone: 't3', pose: 'urgent', to: '/app?tuyen=1',
    copy: {
      vi: { tag: 'Cho quán', title: 'Cần người gấp? Đăng tin trong 1 phút', sub: 'Mô tả ca làm, chọn mức lương, nhận đơn ứng tuyển ngay trong ngày.', cta: 'Đăng tin tuyển' },
      en: { tag: 'For shops', title: 'Need staff fast? Post in 1 minute', sub: 'Describe the shift, set the pay, get applications the same day.', cta: 'Post a job' },
    },
  },
  {
    id: 'trust', tone: 't4', pose: 'search',
    copy: {
      vi: { tag: 'Uy tín', title: 'Làm xong ca, hai bên đánh giá nhau', sub: 'Đi làm đúng giờ, uy tín của bạn tăng dần và lần sau dễ được chọn hơn.' },
      en: { tag: 'Trust', title: 'After each shift, both sides review each other', sub: 'Show up on time and your reputation grows, so you get picked more often.' },
    },
  },
]
