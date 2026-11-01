import type { Category } from './types'

/** Tasks a shop can tap to add to a shift, by kind of job (it can always type its own). */
export const TASK_IDEAS: Record<Category, string[]> = {
  service: ['Bưng bê', 'Dọn bàn', 'Rửa chén ly', 'Phụ bếp', 'Pha chế', 'Thu ngân', 'Đứng quầy'],
  retail: ['Gọt hàng', 'Sơ chế rau củ', 'Lọc cá', 'Xếp hàng lên kệ', 'Đóng gói', 'Bán hàng', 'Kiểm kê'],
  warehouse: ['Bốc xếp', 'Soạn đơn', 'Đóng gói', 'Dán nhãn', 'Kiểm kê', 'Lái xe đẩy'],
  event: ['Dựng sân khấu', 'Phát tờ rơi', 'Tiếp đón khách', 'Dọn dẹp sau sự kiện', 'Bưng bê'],
  farm: ['Thu hoạch', 'Phân loại', 'Lọc cá', 'Gọt hàng', 'Đóng thùng', 'Tưới cây'],
  other: ['Bưng bê', 'Gọt hàng', 'Lọc cá', 'Dọn dẹp', 'Đóng gói'],
}
export const MAX_TASKS = 12
export const MAX_TASK_LEN = 60

/** The same cleaning the database does: trimmed, blanks and repeats dropped, cut to length, at most MAX_TASKS. */
export function cleanTasks(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const t = raw.trim().slice(0, MAX_TASK_LEN)
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase()); out.push(t)
  }
  return out.slice(0, MAX_TASKS)
}
