import type { Job } from './types'

// Mirrors the demo rows seeded into Supabase; used by the mock API for local UI tests.
type SeedJob = Omit<Job, 'filled' | 'status' | 'created_at'>
const E = (n: string) => `11111111-1111-4111-8111-0000000000${n}`

export const seedEmployers: Record<string, { name: string; plan: 'free' | 'pro' }> = {
  [E('02')]: { name: 'Quán Cà Phê Dùng Thử', plan: 'free' },
  [E('11')]: { name: 'Nhà hàng Mộc', plan: 'pro' },
  [E('12')]: { name: 'Kho Hàng Nhanh Bình Dương', plan: 'pro' },
  [E('13')]: { name: 'Sự Kiện Hoa Sen', plan: 'free' },
  [E('14')]: { name: 'Vườn Cam Bảy Hùng', plan: 'free' },
  [E('15')]: { name: 'Siêu Thị Mini Xanh', plan: 'pro' },
}

export const seedJobs: SeedJob[] = [
  { id: 'j1', employer_id: E('11'), business_name: 'Nhà hàng Mộc', title: 'Phụ bếp ca tối', description: 'Sơ chế rau củ, rửa dụng cụ, hỗ trợ bếp chính. Có cơm tối.', category: 'service', pay_amount: 35000, pay_unit: 'hour', start_date: '2026-10-15', end_date: '2026-10-28', shift_note: '18:00–22:00', address: '12 Nguyễn Huệ, Q.1', city: 'TP.HCM', lat: 10.7743, lng: 106.7038, slots: 3, is_urgent: true },
  { id: 'j2', employer_id: E('11'), business_name: 'Nhà hàng Mộc', title: 'Phục vụ bàn cuối tuần', description: 'Chào khách, gọi món, dọn bàn. Ưu tiên nhanh nhẹn, vui vẻ.', category: 'service', pay_amount: 30000, pay_unit: 'hour', start_date: '2026-10-17', end_date: '2026-11-13', shift_note: 'Thứ 7, CN · 10:00–14:00', address: '12 Nguyễn Huệ, Q.1', city: 'TP.HCM', lat: 10.7743, lng: 106.7038, slots: 4, is_urgent: false },
  { id: 'j3', employer_id: E('02'), business_name: 'Quán Cà Phê Dùng Thử', title: 'Pha chế ca sáng', description: 'Pha cà phê, trà sữa cơ bản. Sẽ được hướng dẫn.', category: 'service', pay_amount: 28000, pay_unit: 'hour', start_date: '2026-10-16', end_date: '2026-11-03', shift_note: '6:30–11:00', address: '45 Lê Lợi, Q.1', city: 'TP.HCM', lat: 10.7731, lng: 106.7006, slots: 2, is_urgent: false },
  { id: 'j4', employer_id: E('12'), business_name: 'Kho Hàng Nhanh Bình Dương', title: 'Soạn hàng kho mùa cao điểm', description: 'Soạn, dán nhãn, đóng gói đơn hàng sàn TMĐT. Có xe đưa đón từ Thủ Đức.', category: 'warehouse', pay_amount: 320000, pay_unit: 'day', start_date: '2026-10-15', end_date: '2026-11-28', shift_note: 'Ca ngày 8:00–17:00', address: 'KCN Sóng Thần, Dĩ An', city: 'Bình Dương', lat: 10.9058, lng: 106.7693, slots: 15, is_urgent: true },
  { id: 'j5', employer_id: E('12'), business_name: 'Kho Hàng Nhanh Bình Dương', title: 'Bốc xếp ca đêm', description: 'Bốc xếp hàng lên xe, cần sức khỏe tốt. Phụ cấp ăn khuya.', category: 'warehouse', pay_amount: 400000, pay_unit: 'shift', start_date: '2026-10-16', end_date: '2026-11-23', shift_note: '22:00–6:00', address: 'KCN Sóng Thần, Dĩ An', city: 'Bình Dương', lat: 10.9058, lng: 106.7693, slots: 8, is_urgent: false },
  { id: 'j6', employer_id: E('13'), business_name: 'Sự Kiện Hoa Sen', title: 'Lễ tân sự kiện hội nghị', description: 'Đón khách, phát tài liệu, hướng dẫn chỗ ngồi. Mặc đồng phục được cấp.', category: 'event', pay_amount: 350000, pay_unit: 'day', start_date: '2026-10-20', end_date: '2026-10-21', shift_note: '7:00–17:00', address: 'Trung tâm Hội nghị Ariyana', city: 'Đà Nẵng', lat: 16.0612, lng: 108.2463, slots: 6, is_urgent: false },
  { id: 'j7', employer_id: E('13'), business_name: 'Sự Kiện Hoa Sen', title: 'Hỗ trợ setup sân khấu', description: 'Khuân vác, lắp đặt đồ trang trí, dọn dẹp sau sự kiện.', category: 'event', pay_amount: 300000, pay_unit: 'job', start_date: '2026-10-19', end_date: '2026-10-20', shift_note: 'Theo lịch sự kiện', address: '88 Trần Phú, Hải Châu', city: 'Đà Nẵng', lat: 16.068, lng: 108.221, slots: 5, is_urgent: false },
  { id: 'j8', employer_id: E('14'), business_name: 'Vườn Cam Bảy Hùng', title: 'Thu hoạch cam mùa Tết', description: 'Hái cam, phân loại, đóng thùng. Bao ăn trưa, có chỗ nghỉ.', category: 'farm', pay_amount: 280000, pay_unit: 'day', start_date: '2026-10-24', end_date: '2026-11-23', shift_note: '6:00–15:00', address: 'Phong Điền', city: 'Cần Thơ', lat: 9.997, lng: 105.672, slots: 10, is_urgent: false },
  { id: 'j9', employer_id: E('15'), business_name: 'Siêu Thị Mini Xanh', title: 'Nhân viên bán hàng ca tối', description: 'Tính tiền, sắp xếp kệ hàng, hỗ trợ khách.', category: 'retail', pay_amount: 32000, pay_unit: 'hour', start_date: '2026-10-15', end_date: '2026-12-13', shift_note: '17:00–22:00', address: '20 Cầu Giấy', city: 'Hà Nội', lat: 21.0362, lng: 105.7906, slots: 2, is_urgent: true },
  { id: 'j10', employer_id: E('15'), business_name: 'Siêu Thị Mini Xanh', title: 'Kiểm kê hàng cuối tháng', description: 'Đếm hàng, nhập số liệu theo hướng dẫn. Làm 2 ngày.', category: 'retail', pay_amount: 300000, pay_unit: 'day', start_date: '2026-10-26', end_date: '2026-10-27', shift_note: '8:00–17:00', address: '20 Cầu Giấy', city: 'Hà Nội', lat: 21.0362, lng: 105.7906, slots: 4, is_urgent: false },
]

export const DEMO = {
  seeker: { phone: '0900000001', password: 'demo-tim-viec' },
  employer: { phone: '0900000002', password: 'demo-tuyen-dung' },
}
