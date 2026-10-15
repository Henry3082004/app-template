/** Light tap feedback on supported phones (Android/most webviews; iOS Safari ignores it). */
export function tap(ms = 12) {
  try { navigator.vibrate?.(ms) } catch { /* unsupported */ }
}
