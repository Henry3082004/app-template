import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from './types'

const vi = {
  appName: 'Việc Thời Vụ',
  // nav
  navJobs: 'Việc làm', navApplied: 'Đã ứng tuyển', navAccount: 'Tài khoản', navMyJobs: 'Tin của tôi',
  // jobs list
  jobsTitle: 'Việc thời vụ', iNeedStaff: 'Tôi cần tuyển người', searchPh: 'Tìm việc, cơ sở, khu vực…',
  fAll: 'Tất cả', fUrgent: '⚡ Gấp', catservice: 'Phục vụ', catwarehouse: 'Kho hàng', catevent: 'Sự kiện',
  catfarm: 'Nông nghiệp', catretail: 'Bán hàng', catother: 'Khác',
  emptyJobs: 'Chưa có việc phù hợp. Thử bỏ bớt bộ lọc nhé 👀', nearYou: 'Gần bạn nhất trước',
  useLocation: '📍 Sắp xếp theo khoảng cách', locating: 'Đang tìm vị trí…', locDenied: 'Chưa lấy được vị trí — đang xếp theo tin mới.',
  urgent: '⚡ Gấp', slotsLeft: 'còn {n} chỗ', full: 'Đã đủ người', closed: 'Đã đóng',
  // units
  perhour: 'giờ', perday: 'ngày', pershift: 'ca', perjob: 'việc',
  uhour: 'Giờ', uday: 'Ngày', ushift: 'Ca', ujob: 'Việc',
  // detail
  time: 'Thời gian', place: 'Địa điểm', slots: 'Số người', business: 'Cơ sở', about: 'Mô tả công việc',
  slotsOf: 'Còn {left}/{total} chỗ', applyNow: 'Ứng tuyển ngay', applied: 'Đã gửi đơn ✓',
  messageOpt: 'Lời nhắn cho nhà tuyển dụng (không bắt buộc)', messagePh: 'VD: Em rảnh buổi tối, có kinh nghiệm phục vụ',
  sendApplication: 'Gửi đơn', employerCantApply: 'Bạn đang dùng tài khoản nhà tuyển dụng nên không ứng tuyển được.',
  notFound: 'Không tìm thấy tin này. Có thể tin đã bị xóa.', back: 'Quay lại',
  // success
  appliedTitle: 'Đã gửi đơn!', appliedText: 'Nhà tuyển dụng sẽ liên hệ bạn sớm 🙌', moreJobs: 'Xem thêm việc', seeApplied: 'Xem đơn đã gửi',
  // auth
  signupTitle: 'Tạo tài khoản', loginTitle: 'Đăng nhập', phone: 'Số điện thoại', password: 'Mật khẩu',
  passwordHint: 'Ít nhất 8 ký tự', yourName: 'Tên của bạn', haveAccount: 'Đã có tài khoản? Đăng nhập',
  noAccount: 'Chưa có tài khoản? Tạo mới', authSeekerSub: 'Để nhà tuyển dụng liên hệ được với bạn.',
  authEmployerSub: 'Tạo hồ sơ cơ sở một lần, lần sau đăng tin chỉ mất 1 phút.',
  businessName: 'Tên cơ sở', address: 'Địa chỉ', city: 'Tỉnh / thành phố', continue: 'Tiếp tục',
  saveAndPost: 'Lưu và đăng tin', demoOr: 'hoặc dùng thử ngay', demoSeeker: 'Dùng thử: Người tìm việc',
  demoEmployer: 'Dùng thử: Nhà tuyển dụng', zaloLogin: 'Tiếp tục với Zalo',
  roleSeeker: 'Tôi tìm việc', roleEmployer: 'Tôi tuyển người', iAm: 'Bạn là',
  // applied list
  appliedTitlePage: 'Đã ứng tuyển', stpending: 'Đang chờ', staccepted: 'Được nhận 🎉', strejected: 'Chưa phù hợp', stwithdrawn: 'Đã rút',
  withdraw: 'Rút đơn', withdrawConfirm: 'Rút đơn ứng tuyển này?', call: 'Gọi', zalo: 'Nhắn Zalo',
  employerPhone: 'SĐT nhà tuyển dụng', emptyApplied: 'Bạn chưa ứng tuyển việc nào. Lướt xem việc gần bạn nhé!',
  findJobs: 'Tìm việc', loginToSee: 'Đăng nhập để xem đơn đã gửi.', login: 'Đăng nhập',
  // employer
  myJobsTitle: 'Tin của tôi', postJob: '+ Đăng tin', newApplicants: '{n} ứng viên mới', applicantsN: '{n} ứng viên',
  filledOf: '{filled}/{slots} chỗ', planBar: 'Gói Miễn phí: {open}/2 tin đang mở', upgrade: 'Nâng cấp',
  proBar: 'Gói Pro: đăng tin không giới hạn', firstTip: 'Đăng tin đầu tiên chỉ mất 1 phút',
  emptyMyJobs: 'Bạn chưa có tin nào. Đăng tin đầu tiên để tìm người ngay hôm nay.',
  employerOnly: 'Trang này dành cho nhà tuyển dụng.',
  // post
  postTitle: 'Đăng tin', prefilled: 'Đã điền theo tin trước, sửa nếu cần', jobTitle: 'Tên việc', jobTitlePh: 'VD: Phụ bếp ca tối',
  category: 'Ngành', pay: 'Mức lương (đ)', unit: 'Tính theo', startDate: 'Bắt đầu', endDate: 'Kết thúc',
  shiftNote: 'Ca làm', shiftNotePh: 'VD: 18:00–22:00', slotsNeed: 'Số người cần', description: 'Mô tả',
  descriptionPh: 'Làm gì, yêu cầu gì, có hỗ trợ gì (ăn, xe đưa đón…)', urgentToggle: 'Tin gấp — lên đầu danh sách',
  proOnly: 'Pro', submitPost: 'Đăng tin', postedTitle: 'Đã đăng tin!', postedText: 'Ứng viên sẽ thấy tin của bạn ngay. Có người ứng tuyển sẽ hiện ở "Tin của tôi".',
  backToMyJobs: 'Về Tin của tôi', required: 'Điền giúp mục này nhé', endBeforeStart: 'Ngày kết thúc phải sau ngày bắt đầu',
  // applicants
  applicantsTitle: 'Ứng viên', accept: 'Nhận', reject: 'Từ chối', closeJob: 'Đóng tin', reopenJob: 'Mở lại tin',
  closeConfirm: 'Đóng tin này? Người tìm việc sẽ không thấy nữa.', noApplicants: 'Chưa có ai ứng tuyển. Tin mới thường có ứng viên trong vài giờ ⏳',
  acceptedTitle: 'Đã nhận {name}!', acceptedText: 'Gọi ngay để hẹn lịch nhé', done: 'Xong',
  // account
  accountTitle: 'Tài khoản', language: 'Ngôn ngữ', pricing: 'Bảng giá', signOut: 'Đăng xuất', signOutConfirm: 'Đăng xuất khỏi tài khoản?',
  bio: 'Giới thiệu ngắn', bioPh: 'VD: Sinh viên, rảnh tối và cuối tuần', save: 'Lưu', saved: 'Đã lưu ✓',
  guestAccount: 'Đăng nhập để ứng tuyển và theo dõi đơn của bạn.', planLabel: 'Gói hiện tại', planfree: 'Miễn phí', planpro: 'Pro',
  legal: 'Điều khoản · Bảo mật · Hoàn tiền',
  // pricing
  pricingTitle: 'Bảng giá', pricingSub: 'Người tìm việc luôn miễn phí. Nhà tuyển dụng chọn gói phù hợp.',
  free: 'Miễn phí', pro: 'Pro', freePrice: '0đ', perMonth: '/tháng', perYear: '/năm',
  freeF1: 'Tối đa 2 tin đang mở', freeF2: 'Nhận / từ chối ứng viên', freeF3: 'Xem SĐT người đã nhận',
  proF1: 'Không giới hạn tin', proF2: 'Nhãn ⚡ Gấp — lên đầu danh sách', proF3: 'Mọi tính năng gói Miễn phí',
  yearSave: 'Trả năm tiết kiệm ~2 tháng', currentPlan: 'Gói hiện tại', choosePro: 'Nâng cấp Pro',
  paySoon: 'Thanh toán đang được mở. Bạn sẽ nâng cấp được trong vài ngày tới — cảm ơn bạn đã chờ 💙',
  // errors
  retry: 'Thử lại', copyForClaude: 'Sao chép báo lỗi cho Claude', copied: 'Đã sao chép ✓',
  eNETWORK: 'Mất kết nối. Kiểm tra mạng rồi thử lại nhé.', eINVALID_PHONE: 'Số điện thoại chưa đúng. Nhập dạng 0901234567 nhé.',
  eWEAK_PASSWORD: 'Mật khẩu cần ít nhất 8 ký tự.', eNAME_REQUIRED: 'Cho mình xin tên của bạn nhé.',
  ePHONE_TAKEN: 'Số này đã có tài khoản. Bấm "Đăng nhập" bên dưới nhé.', eINVALID_LOGIN: 'Sai số điện thoại hoặc mật khẩu. Kiểm tra lại nhé.',
  eFREE_PLAN_LIMIT: 'Gói Miễn phí chỉ mở được 2 tin cùng lúc. Đóng bớt một tin hoặc nâng cấp Pro nhé.',
  eURGENT_REQUIRES_PRO: 'Nhãn Gấp dành cho gói Pro. Tắt "Tin gấp" hoặc nâng cấp nhé.',
  eJOB_NOT_OPEN: 'Tin này vừa đóng. Xem việc khác nhé!', eALREADY_APPLIED: 'Bạn đã ứng tuyển việc này rồi.',
  eJOB_FULL: 'Tin đã đủ người rồi.', eALREADY_DECIDED: 'Ứng viên này đã được xử lý rồi. Tải lại trang để xem.',
  eCANNOT_WITHDRAW: 'Đơn đã được xử lý nên không rút được nữa.', eFORBIDDEN: 'Tài khoản này không làm được việc đó.',
  eNOT_SIGNED_IN: 'Bạn cần đăng nhập trước nhé.', eSLOTS_BELOW_FILLED: 'Số người cần không được ít hơn số đã nhận.',
  eUNKNOWN: 'Có lỗi xảy ra. Thử lại sau ít phút nhé.',
}

type Dict = typeof vi
const en: Dict = {
  appName: 'Việc Thời Vụ',
  navJobs: 'Jobs', navApplied: 'Applied', navAccount: 'Account', navMyJobs: 'My posts',
  jobsTitle: 'Short-term jobs', iNeedStaff: 'I need staff', searchPh: 'Search jobs, places, areas…',
  fAll: 'All', fUrgent: '⚡ Urgent', catservice: 'Hospitality', catwarehouse: 'Warehouse', catevent: 'Events',
  catfarm: 'Farm', catretail: 'Retail', catother: 'Other',
  emptyJobs: 'No matching jobs. Try removing a filter 👀', nearYou: 'Closest first',
  useLocation: '📍 Sort by distance', locating: 'Finding your location…', locDenied: "Couldn't get your location — showing newest first.",
  urgent: '⚡ Urgent', slotsLeft: '{n} spots left', full: 'Fully staffed', closed: 'Closed',
  perhour: 'hour', perday: 'day', pershift: 'shift', perjob: 'job',
  uhour: 'Hour', uday: 'Day', ushift: 'Shift', ujob: 'Job',
  time: 'When', place: 'Where', slots: 'Spots', business: 'Business', about: 'About the job',
  slotsOf: '{left}/{total} spots left', applyNow: 'Apply now', applied: 'Applied ✓',
  messageOpt: 'Note to the employer (optional)', messagePh: "e.g. I'm free evenings and have serving experience",
  sendApplication: 'Send application', employerCantApply: "You're signed in as an employer, so you can't apply.",
  notFound: "We couldn't find this post. It may have been removed.", back: 'Back',
  appliedTitle: 'Application sent!', appliedText: "The employer will contact you soon 🙌", moreJobs: 'See more jobs', seeApplied: 'See my applications',
  signupTitle: 'Create account', loginTitle: 'Sign in', phone: 'Phone number', password: 'Password',
  passwordHint: 'At least 8 characters', yourName: 'Your name', haveAccount: 'Have an account? Sign in',
  noAccount: 'New here? Create an account', authSeekerSub: 'So employers can reach you.',
  authEmployerSub: 'Set up your business once; posting next time takes a minute.',
  businessName: 'Business name', address: 'Address', city: 'City / province', continue: 'Continue',
  saveAndPost: 'Save and post', demoOr: 'or try it now', demoSeeker: 'Try as: Job seeker',
  demoEmployer: 'Try as: Employer', zaloLogin: 'Continue with Zalo',
  roleSeeker: 'I want work', roleEmployer: "I'm hiring", iAm: 'You are',
  appliedTitlePage: 'Applied', stpending: 'Pending', staccepted: 'Accepted 🎉', strejected: 'Not a match', stwithdrawn: 'Withdrawn',
  withdraw: 'Withdraw', withdrawConfirm: 'Withdraw this application?', call: 'Call', zalo: 'Message on Zalo',
  employerPhone: "Employer's phone", emptyApplied: "You haven't applied yet. Browse jobs near you!",
  findJobs: 'Find jobs', loginToSee: 'Sign in to see your applications.', login: 'Sign in',
  myJobsTitle: 'My posts', postJob: '+ Post a job', newApplicants: '{n} new applicants', applicantsN: '{n} applicants',
  filledOf: '{filled}/{slots} filled', planBar: 'Free plan: {open}/2 open posts', upgrade: 'Upgrade',
  proBar: 'Pro plan: unlimited posts', firstTip: 'Your first post takes just a minute',
  emptyMyJobs: 'No posts yet. Post your first job and find people today.',
  employerOnly: 'This page is for employers.',
  postTitle: 'Post a job', prefilled: 'Filled from your last post — edit as needed', jobTitle: 'Job title', jobTitlePh: 'e.g. Evening kitchen helper',
  category: 'Category', pay: 'Pay (VND)', unit: 'Per', startDate: 'Start', endDate: 'End',
  shiftNote: 'Shift', shiftNotePh: 'e.g. 18:00–22:00', slotsNeed: 'People needed', description: 'Description',
  descriptionPh: 'Tasks, requirements, perks (meals, transport…)', urgentToggle: 'Urgent — pin to top',
  proOnly: 'Pro', submitPost: 'Post job', postedTitle: 'Job posted!', postedText: 'Seekers can see it now. Applicants will show up in "My posts".',
  backToMyJobs: 'Back to My posts', required: 'Please fill this in', endBeforeStart: 'End date must be after start date',
  applicantsTitle: 'Applicants', accept: 'Accept', reject: 'Decline', closeJob: 'Close post', reopenJob: 'Reopen post',
  closeConfirm: "Close this post? Seekers won't see it anymore.", noApplicants: 'No applicants yet. New posts usually get some within hours ⏳',
  acceptedTitle: 'You accepted {name}!', acceptedText: 'Call now to set up the schedule', done: 'Done',
  accountTitle: 'Account', language: 'Language', pricing: 'Pricing', signOut: 'Sign out', signOutConfirm: 'Sign out of your account?',
  bio: 'Short intro', bioPh: 'e.g. Student, free evenings and weekends', save: 'Save', saved: 'Saved ✓',
  guestAccount: 'Sign in to apply and track your applications.', planLabel: 'Current plan', planfree: 'Free', planpro: 'Pro',
  legal: 'Terms · Privacy · Refunds',
  pricingTitle: 'Pricing', pricingSub: 'Always free for job seekers. Employers pick a plan.',
  free: 'Free', pro: 'Pro', freePrice: '$0', perMonth: '/month', perYear: '/year',
  freeF1: 'Up to 2 open posts', freeF2: 'Accept / decline applicants', freeF3: "See accepted applicants' phones",
  proF1: 'Unlimited posts', proF2: '⚡ Urgent badge — pinned to top', proF3: 'Everything in Free',
  yearSave: 'Pay yearly, save ~2 months', currentPlan: 'Current plan', choosePro: 'Upgrade to Pro',
  paySoon: "Payments are opening soon. You'll be able to upgrade in a few days — thanks for waiting 💙",
  retry: 'Try again', copyForClaude: 'Copy error report for Claude', copied: 'Copied ✓',
  eNETWORK: 'No connection. Check your network and try again.', eINVALID_PHONE: 'That phone number looks off. Use a format like 0901234567.',
  eWEAK_PASSWORD: 'Password needs at least 8 characters.', eNAME_REQUIRED: 'Please tell us your name.',
  ePHONE_TAKEN: 'This number already has an account. Tap "Sign in" below.', eINVALID_LOGIN: 'Wrong phone or password. Please check again.',
  eFREE_PLAN_LIMIT: 'The Free plan allows 2 open posts at a time. Close one or upgrade to Pro.',
  eURGENT_REQUIRES_PRO: 'The Urgent badge is a Pro feature. Turn off "Urgent" or upgrade.',
  eJOB_NOT_OPEN: 'This post just closed. Check out other jobs!', eALREADY_APPLIED: "You've already applied to this job.",
  eJOB_FULL: 'This post is already fully staffed.', eALREADY_DECIDED: 'This applicant was already handled. Reload to see.',
  eCANNOT_WITHDRAW: "This application was already handled, so it can't be withdrawn.", eFORBIDDEN: "This account can't do that.",
  eNOT_SIGNED_IN: 'Please sign in first.', eSLOTS_BELOW_FILLED: "People needed can't be fewer than already accepted.",
  eUNKNOWN: 'Something went wrong. Please try again in a few minutes.',
}

export type TKey = keyof Dict
const dicts: Record<Locale, Dict> = { vi, en }

export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem('locale')
    if (saved === 'vi' || saved === 'en') return saved
  } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && !navigator.language.toLowerCase().startsWith('vi') && navigator.language ? 'en' : 'vi'
}

interface I18n { locale: Locale; setLocale(l: Locale): void; t(k: TKey, vars?: Record<string, string | number>): string }
const Ctx = createContext<I18n>(null as unknown as I18n)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLoc] = useState<Locale>(detectLocale)
  const setLocale = useCallback((l: Locale) => {
    setLoc(l)
    document.documentElement.lang = l
    try { localStorage.setItem('locale', l) } catch { /* ignore */ }
  }, [])
  const t = useCallback((k: TKey, vars?: Record<string, string | number>) => {
    let s = dicts[locale][k] ?? vi[k] ?? k
    if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v))
    return s
  }, [locale])
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
