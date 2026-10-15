import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AuthSheet } from './components/AuthSheet'
import { BottomNav } from './components/BottomNav'
import { CardSkeleton } from './components/Skeleton'
import { I18nProvider } from './lib/i18n'
import { SessionProvider } from './lib/session'
import { IN_ZALO } from './lib/zalo'
import Account from './pages/Account'
import Applicants from './pages/Applicants'
import EmployerJobs from './pages/EmployerJobs'
import JobDetail from './pages/JobDetail'
import Jobs from './pages/Jobs'
import MyApplications from './pages/MyApplications'
import PostJob from './pages/PostJob'
import Pricing from './pages/Pricing'

const Landing = lazy(() => import('./pages/Landing'))
const Legal = lazy(() => import('./pages/Legal'))

/** Pages inside /app share the phone-width shell; nav hides on focused flows. */
function AppShell() {
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith('/app/dang-tin') || pathname.startsWith('/app/viec/')
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { document.title = 'Việc Thời Vụ' }, [])
  return (
    <div className={hideNav ? 'app no-nav' : 'app'}>
      <Routes>
        <Route index element={<Jobs />} />
        <Route path="viec/:id" element={<JobDetail />} />
        <Route path="da-ung-tuyen" element={<MyApplications />} />
        <Route path="tai-khoan" element={<Account />} />
        <Route path="tin-cua-toi" element={<EmployerJobs />} />
        <Route path="dang-tin" element={<PostJob />} />
        <Route path="tin/:id" element={<Applicants />} />
        <Route path="bang-gia" element={<Pricing />} />
        <Route path="*" element={<Jobs />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="app"><CardSkeleton /></div>}>
      <Routes>
        <Route path="/" element={IN_ZALO ? <AppShell /> : <Landing />} />
        <Route path="/app/*" element={<AppShell />} />
        <Route path="/dieu-khoan" element={<Legal kind="terms" />} />
        <Route path="/bao-mat" element={<Legal kind="privacy" />} />
        <Route path="/hoan-tien" element={<Legal kind="refund" />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <AuthSheet />
    </Suspense>
  )
}

export default function App() {
  // Zalo Mini App webviews don't support History API deep links, so use an in-memory router there.
  const Router = IN_ZALO ? MemoryRouter : BrowserRouter
  const routerProps = IN_ZALO ? { initialEntries: ['/app'] } : {}
  return (
    <I18nProvider>
      <SessionProvider>
        <Router {...routerProps}>
          <AppRoutes />
        </Router>
      </SessionProvider>
    </I18nProvider>
  )
}
