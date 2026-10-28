/** Where the phone is right now, or null when it can't or won't say (denied, no GPS, inside some webviews). Never throws. */
export function getPosition(timeoutMs = 8000): Promise<{ lat: number; lng: number } | null> {
  return new Promise((done) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { done(null); return }
    const timer = setTimeout(() => done(null), timeoutMs + 500)
    try {
      navigator.geolocation.getCurrentPosition(
        (p) => { clearTimeout(timer); done({ lat: p.coords.latitude, lng: p.coords.longitude }) },
        () => { clearTimeout(timer); done(null) },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
      )
    } catch { clearTimeout(timer); done(null) }
  })
}
