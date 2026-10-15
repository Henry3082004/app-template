export interface Coords { lat: number; lng: number }

export function km(a: Coords, b: Coords): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function fmtKm(n: number, locale: string): string {
  if (n < 1) return `${Math.round(n * 1000)} m`
  return `${n.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: n < 10 ? 1 : 0 })} km`
}

/** Browser geolocation with our own timeout: some webviews never call back at all. */
export function locate(timeoutMs = 6000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)
    let done = false
    const finish = (v: Coords | null) => { if (!done) { done = true; resolve(v) } }
    const timer = setTimeout(() => finish(null), timeoutMs)
    try {
      navigator.geolocation.getCurrentPosition(
        (p) => { clearTimeout(timer); finish({ lat: p.coords.latitude, lng: p.coords.longitude }) },
        () => { clearTimeout(timer); finish(null) },
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 },
      )
    } catch { clearTimeout(timer); finish(null) }
  })
}

/** City centres, used to place a job on the map when the employer has no GPS. */
export const CITIES: Record<string, Coords> = {
  'TP.HCM': { lat: 10.7769, lng: 106.7009 },
  'Hà Nội': { lat: 21.0285, lng: 105.8542 },
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
  'Bình Dương': { lat: 10.9804, lng: 106.6519 },
  'Đồng Nai': { lat: 10.9574, lng: 106.8426 },
  'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
  'Khánh Hòa': { lat: 12.2388, lng: 109.1967 },
  'Lâm Đồng': { lat: 11.9404, lng: 108.4583 },
  'Khác': { lat: 16.0, lng: 107.5 },
}
