/** True when running inside the Zalo Mini App (zalo/ build sets VITE_ZALO, or the Zalo webview user agent). */
export const IN_ZALO = import.meta.env.VITE_ZALO === '1' ||
  (typeof window !== 'undefined' &&
    (/Zalo/i.test(navigator.userAgent) || new URLSearchParams(location.search).has('zalo')))
