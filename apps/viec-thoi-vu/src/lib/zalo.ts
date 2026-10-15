/** True when running inside the Zalo Mini App webview. */
export const IN_ZALO = typeof window !== 'undefined' &&
  (/Zalo/i.test(navigator.userAgent) || (window as unknown as { ZaloJavaScriptInterface?: unknown }).ZaloJavaScriptInterface !== undefined ||
    new URLSearchParams(location.search).has('zalo'))
