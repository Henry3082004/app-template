import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from './types'

const vi = {
  appName: 'Việc Thời Vụ',
  // nav
  navJobs: 'Việc làm', navApplied: 'Đã ứng tuyển', navAccount: 'Tài khoản', navMyJobs: 'Tin của tôi',
  // jobs list
  jobsTitle: 'Việc thời vụ', iNeedStaff: 'Tôi cần tuyển người', searchPh: 'Tìm việc, cơ sở, khu vực…',
  fAll: 'Tất cả', fUrgent: 'Gấp', catservice: 'Phục vụ', catwarehouse: 'Kho hàng', catevent: 'Sự kiện',
  catfarm: 'Nông nghiệp', catretail: 'Bán hàng', catother: 'Khác',
  emptyJobs: 'Chưa có việc phù hợp. Thử bỏ bớt bộ lọc nhé 👀', nearYou: 'Gần bạn nhất trước',
  useLocation: 'Sắp xếp theo khoảng cách', locating: 'Đang tìm vị trí…', locDenied: 'Chưa lấy được vị trí — đang xếp theo tin mới.',
  urgent: 'Gấp', slotsLeft: 'còn {n} chỗ', full: 'Đã đủ người', closed: 'Đã đóng',
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
  appliedTitle: 'Đã gửi đơn!', appliedText: 'Capy cổ vũ bạn hết mình 🙌 Nhà tuyển dụng sẽ liên hệ bạn sớm.', moreJobs: 'Xem thêm việc', seeApplied: 'Xem đơn đã gửi',
  // auth
  signupTitle: 'Tạo tài khoản', loginTitle: 'Đăng nhập', phone: 'Số điện thoại', password: 'Mật khẩu',
  passwordHint: 'Ít nhất 8 ký tự', yourName: 'Tên của bạn', haveAccount: 'Đã có tài khoản? Đăng nhập',
  noAccount: 'Chưa có tài khoản? Tạo mới', authSeekerSub: 'Tạo tài khoản trong 10 giây để nhà tuyển dụng liên hệ bạn.',
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
  proBar: 'Gói Pro: đăng tin không giới hạn', firstTip: '🍊 Đăng tin đầu tiên chỉ mất 1 phút thôi!',
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
  acceptedTitle: 'Chốt {name} rồi!', acceptedText: 'Gọi ngay để hẹn lịch nhé 🎉', done: 'Xong',
  // account
  accountTitle: 'Tài khoản', language: 'Ngôn ngữ', pricing: 'Bảng giá', signOut: 'Đăng xuất', signOutConfirm: 'Đăng xuất khỏi tài khoản?',
  bio: 'Giới thiệu ngắn', bioPh: 'VD: Sinh viên, rảnh tối và cuối tuần', save: 'Lưu', saved: 'Đã lưu ✓',
  guestAccount: 'Đăng nhập để ứng tuyển và theo dõi đơn của bạn.', planLabel: 'Gói hiện tại', planfree: 'Miễn phí', planpro: 'Pro',
  legal: 'Điều khoản · Bảo mật · Hoàn tiền',
  // pricing
  pricingTitle: 'Bảng giá', pricingSub: 'Người tìm việc luôn miễn phí. Nhà tuyển dụng chọn gói phù hợp.',
  free: 'Miễn phí', pro: 'Pro', freePrice: '0đ', perMonth: '/tháng', perYear: '/năm',
  freeF1: 'Tối đa 2 tin đang mở', freeF2: 'Nhận / từ chối ứng viên', freeF3: 'Xem SĐT người đã nhận',
  proF1: 'Không giới hạn tin', proF2: 'Nhãn Gấp — lên đầu danh sách', proF3: 'Mọi tính năng gói Miễn phí',
  yearSave: 'Trả năm tiết kiệm ~2 tháng', currentPlan: 'Gói hiện tại', choosePro: 'Nâng cấp Pro',
  paySoon: 'Thanh toán đang được mở. Bạn sẽ nâng cấp được trong vài ngày tới — cảm ơn bạn đã chờ 💙',
  // errors
  retry: 'Thử lại', copyForClaude: 'Sao chép báo lỗi cho Claude', copied: 'Đã sao chép ✓',
  eNETWORK: 'Mất kết nối. Kiểm tra mạng rồi thử lại giúp Capy nhé.', eINVALID_PHONE: 'Số điện thoại chưa đúng. Nhập dạng 0901234567 nhé.',
  eWEAK_PASSWORD: 'Mật khẩu cần ít nhất 8 ký tự.', eNAME_REQUIRED: 'Cho mình xin tên của bạn nhé.',
  ePHONE_TAKEN: 'Số này đã có tài khoản. Bấm "Đăng nhập" bên dưới nhé.', eINVALID_LOGIN: 'Sai số điện thoại hoặc mật khẩu. Kiểm tra lại nhé.',
  eFREE_PLAN_LIMIT: 'Gói Miễn phí chỉ mở được 2 tin cùng lúc. Đóng bớt một tin hoặc nâng cấp Pro nhé.',
  eURGENT_REQUIRES_PRO: 'Nhãn Gấp dành cho gói Pro. Tắt "Tin gấp" hoặc nâng cấp nhé.',
  eJOB_NOT_OPEN: 'Tin này vừa đóng. Xem việc khác nhé!', eALREADY_APPLIED: 'Bạn đã ứng tuyển việc này rồi.',
  eJOB_FULL: 'Tin đã đủ người rồi.', eALREADY_DECIDED: 'Ứng viên này đã được xử lý rồi. Tải lại trang để xem.',
  eCANNOT_WITHDRAW: 'Đơn đã được xử lý nên không rút được nữa.', eFORBIDDEN: 'Tài khoản này không làm được việc đó.',
  eNOT_SIGNED_IN: 'Bạn cần đăng nhập trước nhé.', eSLOTS_BELOW_FILLED: 'Số người cần không được ít hơn số đã nhận.',
  eUNKNOWN: 'Có lỗi xảy ra. Thử lại sau ít phút nhé.',
  capyFound: 'Capy tìm được {n} việc nè 🍊', capyLoading: 'Capy đang tìm việc cho bạn…', capyErrTitle: 'Ối, có trục trặc nhỏ',
  emptyTitle: 'Chưa có việc hợp ý', emptySub: 'Thử bỏ bớt bộ lọc nha.', clearFilters: 'Bỏ bộ lọc',
  pickJob: 'Chọn một việc để xem chi tiết', pickJobSub: 'Thông tin ca làm và nút ứng tuyển sẽ hiện ở đây.',
  pickPost: 'Chọn một tin', pickPostSub: 'Danh sách ứng viên sẽ hiện ở đây.',
  catLabel: 'Ngành nghề', area: 'Khu vực', allAreas: 'Tất cả khu vực', minPay: 'Lương tối thiểu', noLimit: 'Không giới hạn',
  backJobs: '← Quay lại', backMine: '← Tin của tôi', byeSub: 'Tạm biệt nhé, Capy chờ bạn quay lại!',
  whoSees: 'Người tìm việc sẽ thấy', signIn: 'Đăng nhập', loginHello: 'Ứng tuyển ngay 👋', hireHello: 'Tạo hồ sơ cơ sở',
  clearable: 'Bỏ chọn', openApp: 'Mở app', tagline: 'tìm nhanh, nhận việc trong ngày', popular: 'Phổ biến',
  // escrow + reputation
  cancel: 'Đóng', payNone: 'Chờ nạp tiền giữ chỗ', payHeld: 'Tiền đã được giữ', payReleased: 'Đã trả công', payRefunded: 'Đã hoàn tiền', payNoshow: 'Báo vắng, chờ phản hồi', payDisputed: 'Đang tạm giữ',
  testMode: 'Chế độ thử: chưa trừ tiền thật', testModeSub: 'Bạn đang thử luồng giữ tiền. Không có khoản tiền thật nào bị trừ hay chuyển đi.',
  fundCta: 'Nạp tiền giữ chỗ', fundTitle: 'Giữ tiền công cho ca này', fundHint: 'Nạp trước để người làm yên tâm. Tiền được giữ an toàn và chỉ chuyển cho họ khi bạn xác nhận ca đã xong.',
  fundHours: 'Tổng số giờ làm dự kiến', fundAmount: 'Bạn nạp', fundFee: 'Phí nền tảng ({pct}%, trừ vào phần người làm nhận)', fundNet: 'Người làm nhận', fundConfirm: 'Xác nhận nạp tiền',
  fundWaiting: 'Quán chưa nạp tiền giữ chỗ. Số liên hệ của quán sẽ hiện khi tiền đã được giữ.', fundWaitingEmp: 'Nạp tiền giữ chỗ để người làm thấy số liên hệ của bạn và yên tâm sẽ được trả công.',
  heldSeeker: 'Tiền công {amount} (sau phí) đã được giữ an toàn cho bạn.', heldEmp: 'Đã giữ {amount} cho ca này.',
  completeCta: 'Xác nhận đã làm xong', completeTitle: 'Người làm đã đến chưa?', completeTooEarly: 'Xác nhận được từ ngày bắt đầu ca.',
  attOk: 'Đến đủ ca', attOkSub: 'Trả tiền công cho người làm', attLate: 'Đến muộn', attLateSub: 'Vẫn trả tiền công, ghi nhận đến muộn', attNoshow: 'Không đến', attNoshowSub: 'Hoàn tiền cho bạn (người làm sẽ được hỏi lại)',
  disputeCta: 'Báo sự cố', disputeTitle: 'Báo sự cố với ca này', disputeHint: 'Tiền sẽ được tạm giữ cho đến khi sự việc được xem xét. Hãy nói ngắn gọn chuyện gì đã xảy ra.', disputePh: 'Chuyện gì đã xảy ra?', disputeSend: 'Gửi báo sự cố',
  disputedNote: 'Tiền đang được tạm giữ. Bên nền tảng sẽ xem xét và liên hệ cả hai bên.',
  noshowWaiting: 'Bạn đã báo người làm vắng. Chờ họ phản hồi (không trả lời sau 48 giờ thì tiền tự hoàn lại cho bạn).', noshowAsk: 'Quán báo bạn không đến ca này.', noshowYes: 'Đúng, tôi không đến', noshowNo: 'Không đúng, tôi có đến',
  releasedEmp: 'Đã trả {amount} cho người làm.', releasedSeeker: 'Ca đã xong. Tiền công {amount} (sau phí) sẽ chuyển cho bạn.', refundedNote: 'Ca này đã hoàn tiền cho quán.',
  reviewCta: 'Đánh giá', reviewedDone: 'Đã đánh giá', reviewTitleSeeker: 'Đánh giá quán', reviewTitleEmp: 'Đánh giá người làm',
  reviewHint: 'Đánh giá chỉ hiện khi cả hai bên đã đánh giá, hoặc sau 7 ngày. Nên cứ nói thật nhé.', reviewPh: 'Nhận xét ngắn (không bắt buộc)', reviewSend: 'Gửi đánh giá', reviewThanks: 'Cảm ơn bạn! Capy đã ghi lại rồi 🍊',
  tag_hardworking: 'Chăm chỉ', tag_punctual: 'Đúng giờ', tag_polite: 'Lịch sự', tag_fast_learner: 'Học nhanh',
  tag_accurate_description: 'Đúng mô tả việc', tag_friendly: 'Thân thiện', tag_clean_safe: 'Sạch sẽ, an toàn', tag_clear_instructions: 'Hướng dẫn rõ ràng',
  repNew: 'Mới', repGood: 'Đáng tin', repOk: 'Ổn', repWarn: 'Cần lưu ý', repShifts: '{n} ca xong', repNoShifts: 'Chưa có ca nào', repNoshow: '{n} lần vắng', repLate: '{n} lần muộn', repRatings: '{n} đánh giá',
  repTitle: 'Uy tín của bạn', repEmployerNew: 'Quán mới, chưa có ca hoàn thành', myReviewsTitle: 'Đánh giá về bạn', noReviewsYet: 'Chưa có đánh giá nào được hiển thị.',
  eNOT_FUNDED: 'Ca này chưa được nạp tiền giữ chỗ.', eTOO_EARLY: 'Chỉ xác nhận được từ ngày bắt đầu ca.', eALREADY_FUNDED: 'Ca này đã được nạp tiền rồi.',
  eALREADY_SETTLED: 'Ca này đã được xử lý xong.', eNOT_ACCEPTED: 'Chỉ nạp tiền được cho người đã nhận.', eJOB_ENDED: 'Tin này đã kết thúc nên không nạp tiền được nữa.',
  ePAYMENT_NOT_AVAILABLE: 'Thanh toán thật chưa mở. Bạn quay lại sau nhé.', eCANNOT_DISPUTE: 'Ca này không báo sự cố được ở trạng thái hiện tại.',
  eNOT_COMPLETED: 'Chỉ đánh giá được sau khi ca đã xong.', eALREADY_REVIEWED: 'Bạn đã đánh giá ca này rồi.', eREVIEW_WINDOW_CLOSED: 'Đã quá hạn 30 ngày để đánh giá ca này.',
  eBAD_HOURS: 'Số giờ chưa hợp lý. Hãy nhập lại nhé.', eBAD_STARS: 'Hãy chọn số sao từ 1 đến 5.', eBAD_TAGS: 'Có nhãn không hợp lệ.', eBAD_ATTENDANCE: 'Lựa chọn không hợp lệ.',
  // admin + payouts
  navAdmin: 'Quản trị', adminTitle: 'Quản trị', adminTabDisputes: 'Tranh chấp', adminTabPayouts: 'Chuyển tiền', adminNoAccess: 'Trang này chỉ dành cho quản trị viên.',
  noDisputes: 'Không có tranh chấp nào đang chờ.', noPayouts: 'Chưa có khoản nào cần chuyển.', adminEmployer: 'Quán', adminWorker: 'Người làm', adminReason: 'Lý do', adminAttendance: 'Chấm công',
  reasonContest: 'Người làm không đồng ý với báo vắng.', attLabelOk: 'Đến đủ ca', attLabelLate: 'Đến muộn', attLabelNoshow: 'Báo vắng',
  resolveNote: 'Ghi chú quyết định (không bắt buộc)', resolveRelease: 'Trả cho người làm', resolveRefund: 'Hoàn tiền cho quán',
  resolveConfirmRelease: 'Trả tiền công cho người làm? Việc này không hoàn tác được.', resolveConfirmRefund: 'Hoàn tiền cho quán? Việc này không hoàn tác được.',
  payoutPending: 'Chờ chuyển', payoutPaid: 'Đã chuyển', markPaid: 'Đã chuyển khoản', payoutRef: 'Mã giao dịch ngân hàng', copyAcct: 'Sao chép số tài khoản', modeTest: 'Thử', noBankYet: 'Người làm chưa điền tài khoản nhận tiền.',
  bankTitle: 'Tài khoản nhận tiền', bankHint: 'Chỉ dùng để chuyển tiền công cho bạn. Chỉ bạn và quản trị viên xem được.', bankName: 'Ngân hàng', bankAccount: 'Số tài khoản', bankHolder: 'Tên chủ tài khoản', bankSaved: 'Đã lưu tài khoản',
  bankMissing: 'Bạn chưa điền tài khoản nhận tiền. Vào Tài khoản để điền, nếu không mình chưa chuyển tiền cho bạn được.', payoutWaiting: 'Đang chờ chuyển khoản cho bạn.', payoutDone: 'Đã chuyển khoản cho bạn.', fillBank: 'Điền tài khoản',
  eBAD_BANK: 'Thông tin ngân hàng chưa đúng. Số tài khoản chỉ gồm 6 đến 20 chữ số.', eBAD_OUTCOME: 'Lựa chọn không hợp lệ.', eNOT_DISPUTED: 'Ca này không còn ở trạng thái tranh chấp.', ePAYOUT_DONE: 'Khoản này đã được đánh dấu chuyển rồi.', eREFERENCE_REQUIRED: 'Hãy nhập mã giao dịch ngân hàng.',
  // reputation as the core
  repHeadline: 'Uy tín', repStatShifts: 'Ca hoàn thành', repStatOnTime: 'Đúng giờ', repStatPartners: 'Đối tác', repStatNoshow: 'Lần vắng',
  repOnTime: '{n}% đúng giờ', repPartners: '{n} đối tác', repNewShop: 'Quán mới', repNewWorker: 'Người mới', repWhy: 'Tính từ các ca đã làm qua app trong 12 tháng. Mỗi đối tác chỉ tính một đánh giá, ca dưới 50.000đ không tính.',
  pendingReviews: 'Bạn còn {n} ca chưa đánh giá. Đánh giá giúp mọi người tin nhau hơn.', pendingReviewsEmp: 'Bạn còn {n} ca chưa đánh giá. Mở tin để đánh giá người làm.',
  otherReviewed: 'Bên kia đã đánh giá bạn. Hãy đánh giá lại để xem họ nói gì.', reviewNudge: 'Đánh giá chỉ mất 5 giây và giúp người sau chọn đúng.',
  adminTabFlags: 'Cảnh báo', noFlags: 'Chưa thấy dấu hiệu bất thường.', flag_repeat_pair: 'Cùng một cặp làm nhiều ca trong 30 ngày', flag_new_accounts: 'Hai tài khoản mới tạo đã làm và trả tiền cho nhau', flagShifts: '{n} ca',
  // free mode (no money yet)
  freeConfirmHint: 'Sau ca, bấm xác nhận để tính uy tín cho người làm.', freeSeekerHint: 'Sau ca, quán sẽ xác nhận để tính uy tín cho bạn.',
  attOkSubFree: 'Ghi nhận hoàn thành ca', attLateSubFree: 'Ghi nhận hoàn thành, có đến muộn', attNoshowSubFree: 'Ghi nhận vắng (người làm sẽ được hỏi lại)',
  noshowWaitingFree: 'Bạn đã báo người làm vắng. Chờ họ phản hồi (không trả lời sau 48 giờ thì tự ghi nhận vắng).',
  releasedFree: 'Đã xác nhận ca hoàn thành.', releasedSeekerFree: 'Quán đã xác nhận bạn hoàn thành ca.',
  noshowRecorded: 'Đã ghi nhận người làm vắng.', noshowRecordedSeeker: 'Ca này được ghi nhận là vắng.', disputedFree: 'Hai bên chưa thống nhất. Bên nền tảng sẽ xem xét và liên hệ cả hai.',
}

type Dict = typeof vi
const en: Dict = {
  appName: 'Việc Thời Vụ',
  navJobs: 'Jobs', navApplied: 'Applied', navAccount: 'Account', navMyJobs: 'My posts',
  jobsTitle: 'Short-term jobs', iNeedStaff: 'I need staff', searchPh: 'Search jobs, places, areas…',
  fAll: 'All', fUrgent: 'Urgent', catservice: 'Hospitality', catwarehouse: 'Warehouse', catevent: 'Events',
  catfarm: 'Farm', catretail: 'Retail', catother: 'Other',
  emptyJobs: 'No matching jobs. Try removing a filter 👀', nearYou: 'Closest first',
  useLocation: 'Sort by distance', locating: 'Finding your location…', locDenied: "Couldn't get your location — showing newest first.",
  urgent: 'Urgent', slotsLeft: '{n} spots left', full: 'Fully staffed', closed: 'Closed',
  perhour: 'hour', perday: 'day', pershift: 'shift', perjob: 'job',
  uhour: 'Hour', uday: 'Day', ushift: 'Shift', ujob: 'Job',
  time: 'When', place: 'Where', slots: 'Spots', business: 'Business', about: 'About the job',
  slotsOf: '{left}/{total} spots left', applyNow: 'Apply now', applied: 'Applied ✓',
  messageOpt: 'Note to the employer (optional)', messagePh: "e.g. I'm free evenings and have serving experience",
  sendApplication: 'Send application', employerCantApply: "You're signed in as an employer, so you can't apply.",
  notFound: "We couldn't find this post. It may have been removed.", back: 'Back',
  appliedTitle: 'Application sent!', appliedText: "Capy is cheering you on 🙌 The employer will contact you soon.", moreJobs: 'See more jobs', seeApplied: 'See my applications',
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
  proBar: 'Pro plan: unlimited posts', firstTip: '🍊 Your first post takes just 1 minute!',
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
  proF1: 'Unlimited posts', proF2: 'Urgent badge — pinned to top', proF3: 'Everything in Free',
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
  capyFound: 'Capy found {n} jobs 🍊', capyLoading: 'Capy is finding jobs for you…', capyErrTitle: 'Oops, a small hiccup',
  emptyTitle: 'No jobs match yet', emptySub: 'Try removing a filter.', clearFilters: 'Clear filters',
  pickJob: 'Pick a job to see details', pickJobSub: 'Shift info and the apply button will show here.',
  pickPost: 'Pick a post', pickPostSub: 'Its applicants will show here.',
  catLabel: 'Category', area: 'Area', allAreas: 'All areas', minPay: 'Minimum pay', noLimit: 'No limit',
  backJobs: '← Back', backMine: '← My posts', byeSub: 'Bye for now — Capy will be waiting for you!',
  whoSees: 'What job seekers will see', signIn: 'Sign in', loginHello: 'Apply now 👋', hireHello: 'Set up your business',
  clearable: 'Clear', openApp: 'Open app', tagline: 'find fast, start today', popular: 'Popular',
  // escrow + reputation
  cancel: 'Close', payNone: 'Waiting for deposit', payHeld: 'Money held', payReleased: 'Paid out', payRefunded: 'Refunded', payNoshow: 'No-show reported', payDisputed: 'On hold',
  testMode: 'Test mode: no real money charged', testModeSub: "You're trying the deposit flow. No real money is charged or moved.",
  fundCta: 'Deposit to hold the spot', fundTitle: 'Hold the pay for this shift', fundHint: 'Deposit first so the worker can rely on it. The money is held safely and only released when you confirm the shift is done.',
  fundHours: 'Total expected hours', fundAmount: 'You deposit', fundFee: 'Platform fee ({pct}%, taken from the worker’s share)', fundNet: 'Worker receives', fundConfirm: 'Confirm deposit',
  fundWaiting: "The business hasn't deposited yet. Their contact details show once the money is held.", fundWaitingEmp: 'Deposit to show your contact details to the worker and reassure them they will be paid.',
  heldSeeker: 'Your pay of {amount} (after fee) is held safely for you.', heldEmp: '{amount} is held for this shift.',
  completeCta: 'Confirm shift done', completeTitle: 'Did the worker show up?', completeTooEarly: 'You can confirm from the shift start date.',
  attOk: 'Full shift', attOkSub: 'Pay the worker', attLate: 'Came late', attLateSub: 'Still pay, record as late', attNoshow: 'No-show', attNoshowSub: 'Refund you (the worker will be asked)',
  disputeCta: 'Report a problem', disputeTitle: 'Report a problem with this shift', disputeHint: 'The money stays on hold until this is reviewed. Briefly say what happened.', disputePh: 'What happened?', disputeSend: 'Send report',
  disputedNote: 'The money is on hold. The platform will review and contact both sides.',
  noshowWaiting: "You reported the worker as absent. Waiting for their reply (no reply in 48 hours refunds you automatically).", noshowAsk: 'The business says you did not show up for this shift.', noshowYes: "Correct, I didn't come", noshowNo: 'Not true, I was there',
  releasedEmp: '{amount} paid to the worker.', releasedSeeker: 'Shift done. Your pay of {amount} (after fee) will be sent to you.', refundedNote: 'This shift was refunded to the business.',
  reviewCta: 'Review', reviewedDone: 'Reviewed', reviewTitleSeeker: 'Review this business', reviewTitleEmp: 'Review this worker',
  reviewHint: 'Reviews show only when both sides have reviewed, or after 7 days. So be honest.', reviewPh: 'A short comment (optional)', reviewSend: 'Send review', reviewThanks: 'Thank you! Capy noted it 🍊',
  tag_hardworking: 'Hard-working', tag_punctual: 'On time', tag_polite: 'Polite', tag_fast_learner: 'Fast learner',
  tag_accurate_description: 'Matched the description', tag_friendly: 'Friendly', tag_clean_safe: 'Clean & safe', tag_clear_instructions: 'Clear instructions',
  repNew: 'New', repGood: 'Trusted', repOk: 'OK', repWarn: 'Caution', repShifts: '{n} shifts done', repNoShifts: 'No shifts yet', repNoshow: '{n} no-shows', repLate: '{n} late', repRatings: '{n} reviews',
  repTitle: 'Your reputation', repEmployerNew: 'New business, no completed shifts yet', myReviewsTitle: 'Reviews about you', noReviewsYet: 'No reviews are visible yet.',
  eNOT_FUNDED: "This shift hasn't been funded yet.", eTOO_EARLY: 'You can only confirm from the shift start date.', eALREADY_FUNDED: 'This shift is already funded.',
  eALREADY_SETTLED: 'This shift is already settled.', eNOT_ACCEPTED: 'You can only deposit for an accepted person.', eJOB_ENDED: 'This post has ended, so you can no longer deposit.',
  ePAYMENT_NOT_AVAILABLE: 'Real payments are not open yet. Please come back later.', eCANNOT_DISPUTE: "This shift can't be reported in its current state.",
  eNOT_COMPLETED: 'You can only review after the shift is done.', eALREADY_REVIEWED: 'You already reviewed this shift.', eREVIEW_WINDOW_CLOSED: 'The 30-day window to review this shift has closed.',
  eBAD_HOURS: "That number of hours doesn't look right. Please try again.", eBAD_STARS: 'Please pick 1 to 5 stars.', eBAD_TAGS: 'Some labels are not valid.', eBAD_ATTENDANCE: 'Invalid choice.',
  // admin + payouts
  navAdmin: 'Admin', adminTitle: 'Admin', adminTabDisputes: 'Disputes', adminTabPayouts: 'Payouts', adminNoAccess: 'This page is for administrators only.',
  noDisputes: 'No disputes waiting.', noPayouts: 'Nothing to pay out yet.', adminEmployer: 'Business', adminWorker: 'Worker', adminReason: 'Reason', adminAttendance: 'Attendance',
  reasonContest: 'The worker disputes the no-show report.', attLabelOk: 'Full shift', attLabelLate: 'Late', attLabelNoshow: 'No-show reported',
  resolveNote: 'Decision note (optional)', resolveRelease: 'Pay the worker', resolveRefund: 'Refund the business',
  resolveConfirmRelease: 'Pay the worker? This cannot be undone.', resolveConfirmRefund: 'Refund the business? This cannot be undone.',
  payoutPending: 'To pay', payoutPaid: 'Paid', markPaid: 'Mark as transferred', payoutRef: 'Bank transaction reference', copyAcct: 'Copy account number', modeTest: 'Test', noBankYet: "The worker hasn't added a bank account.",
  bankTitle: 'Payout account', bankHint: 'Only used to send your pay. Only you and the admin can see it.', bankName: 'Bank', bankAccount: 'Account number', bankHolder: 'Account holder name', bankSaved: 'Account saved',
  bankMissing: "You haven't added a payout account. Add it in Account, otherwise we can't send your pay.", payoutWaiting: 'Waiting for the bank transfer to you.', payoutDone: 'The transfer to you is done.', fillBank: 'Add account',
  eBAD_BANK: 'The bank details look wrong. The account number must be 6 to 20 digits.', eBAD_OUTCOME: 'Invalid choice.', eNOT_DISPUTED: 'This shift is no longer in dispute.', ePAYOUT_DONE: 'This payout is already marked as sent.', eREFERENCE_REQUIRED: 'Please enter the bank transaction reference.',
  // reputation as the core
  repHeadline: 'Reputation', repStatShifts: 'Shifts done', repStatOnTime: 'On time', repStatPartners: 'Partners', repStatNoshow: 'No-shows',
  repOnTime: '{n}% on time', repPartners: '{n} partners', repNewShop: 'New business', repNewWorker: 'New worker', repWhy: 'Based on shifts done through the app in the last 12 months. Each partner counts once; shifts under 50,000đ are ignored.',
  pendingReviews: 'You have {n} shifts to review. Reviews help everyone trust each other.', pendingReviewsEmp: 'You have {n} shifts to review. Open a post to review the worker.',
  otherReviewed: 'The other side reviewed you. Review them to see what they said.', reviewNudge: 'Reviewing takes 5 seconds and helps the next person choose well.',
  adminTabFlags: 'Alerts', noFlags: 'Nothing unusual so far.', flag_repeat_pair: 'Same pair, many shifts within 30 days', flag_new_accounts: 'Two brand-new accounts paid each other', flagShifts: '{n} shifts',
  // free mode (no money yet)
  freeConfirmHint: 'After the shift, confirm it so it counts toward the worker’s reputation.', freeSeekerHint: 'After the shift, the business confirms it so it counts toward your reputation.',
  attOkSubFree: 'Record the shift as done', attLateSubFree: 'Record as done, but late', attNoshowSubFree: 'Record as absent (the worker will be asked)',
  noshowWaitingFree: 'You reported the worker as absent. Waiting for their reply (no reply in 48 hours records the absence).',
  releasedFree: 'Shift confirmed as done.', releasedSeekerFree: 'The business confirmed you completed the shift.',
  noshowRecorded: 'Absence recorded.', noshowRecordedSeeker: 'This shift was recorded as an absence.', disputedFree: 'The two sides disagree. The platform will review and contact both of you.',
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
