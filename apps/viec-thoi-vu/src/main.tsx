import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary, initSentry } from './lib/sentry'
import './styles.css'

initSentry()

function Crash() {
  return (
    <div className="app" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 44 }}>😵</div>
      <h2 style={{ marginTop: 12 }}>Có lỗi xảy ra / Something went wrong</h2>
      <p className="muted mt-8">Tải lại trang giúp mình nhé. / Please reload the page.</p>
      <button className="btn primary mt-24" onClick={() => location.reload()}>Tải lại / Reload</button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<Crash />}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.VITE_MOCK !== '1') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined))
}
