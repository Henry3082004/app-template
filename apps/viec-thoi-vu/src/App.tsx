import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthDialog } from './components/AuthDialog'
import { CompleteProfileDialog } from './components/CompleteProfileDialog'
import { InstallBanner } from './components/InstallBanner'
import { QuickQuiz } from './components/QuickQuiz'
import { ViewAsBar } from './components/ViewAsBar'
import { Shell } from './components/Shell'
import { Skel } from './components/ui'
import { WorkerIntroDialog } from './components/WorkerIntroDialog'
import { I18nProvider } from './lib/i18n'
import { SessionProvider, useSession } from './lib/session'
import { IN_ZALO } from './lib/zalo'
import Admin from './pages/Admin'
import Account from './pages/Account'
import EmployerJobs from './pages/EmployerJobs'
import Home from './pages/Home'
import Income from './pages/Income'
import Jobs from './pages/Jobs'
import MyApplications from './pages/MyApplications'
import PostJob from './pages/PostJob'
import Shifts from './pages/Shifts'
import Pricing from './pages/Pricing'

const Landing = lazy(() => import('./pages/Landing'))
const Legal = lazy(() => import('./pages/Legal'))

/** Workers land on their home; visitors and shops go straight to the jobs (shops are redirected on from there). */
function HomeOrJobs() {
  const { profile } = useSession()
  return profile?.role === 'seeker' ? <Home /> : <Jobs />
}

/** Everything under /app lives in the responsive shell (bottom bar · side rail · top bar). */
function AppPages() {
  const { pathname } = useLocation()
  useEffect(() => { document.title = 'Việc Thời Vụ' }, [])
  useEffect(() => { document.querySelector('.main')?.scrollTo(0, 0) }, [pathname])
  return (
    <Shell>
      <Routes>
        <Route index element={<HomeOrJobs />} />
        <Route path="viec-lam" element={<Jobs />} />
        <Route path="viec/:id" element={<Jobs />} />
        <Route path="cham-cong" element={<Shifts />} />
        <Route path="thu-nhap" element={<Income />} />
        <Route path="da-ung-tuyen" element={<MyApplications />} />
        <Route path="tai-khoan" element={<Account />} />
        <Route path="tin-cua-toi" element={<EmployerJobs />} />
        <Route path="tin/:id" element={<EmployerJobs />} />
        <Route path="dang-tin" element={<PostJob />} />
        <Route path="bang-gia" element={<Pricing />} />
        <Route path="quan-tri" element={<Admin />} />
        <Route path="*" element={<Jobs />} />
      </Routes>
    </Shell>
  )
}

/** The link opens the app itself (the intro page lives at /gioi-thieu); share links like ?tuyen=1 keep working. */
function HomeRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/app', search }} replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="pg"><Skel n={2} /></div>}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/gioi-thieu" element={<Landing />} />
        <Route path="/app/*" element={<AppPages />} />
        <Route path="/dieu-khoan" element={<Legal kind="terms" />} />
        <Route path="/bao-mat" element={<Legal kind="privacy" />} />
        <Route path="/hoan-tien" element={<Legal kind="refund" />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
      <AuthDialog />
      <CompleteProfileDialog />
      <WorkerIntroDialog />
      <QuickQuiz />
      <InstallBanner />
      <ViewAsBar />
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
