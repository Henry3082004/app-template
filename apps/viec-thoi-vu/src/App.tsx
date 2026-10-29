import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthDialog } from './features/account/AuthDialog'
import { CompleteProfileDialog } from './features/account/CompleteProfileDialog'
import { InstallBanner } from './components/InstallBanner'
import { QuickQuiz } from './components/QuickQuiz'
import { ViewAsBar } from './features/account/ViewAsBar'
import { Shell } from './components/Shell'
import { Skel } from './components/ui'
import { WorkerIntroDialog } from './features/account/WorkerIntroDialog'
import { I18nProvider } from './lib/i18n'
import { queryClient } from './lib/query'
import { SessionProvider } from './lib/session'
import { IN_ZALO } from './lib/zalo'
import Admin from './features/admin/Admin'
import Account from './features/account/Account'
import EmployerCandidates from './features/hiring/EmployerCandidates'
import FindWorkers from './features/hiring/FindWorkers'
import Saved from './features/jobs/Saved'
import EmployerJobs from './features/jobs/EmployerJobs'
import EmployerShifts from './features/shifts/EmployerShifts'
import Income from './features/shifts/Income'
import Jobs from './features/jobs/Jobs'
import Notifications from './features/collab/Notifications'
import MyApplications from './features/jobs/MyApplications'
import PostJob from './features/jobs/PostJob'
import Shifts from './features/shifts/Shifts'
import Spend from './features/shifts/Spend'
import Pricing from './features/public/Pricing'

const Landing = lazy(() => import('./features/public/Landing'))
const Legal = lazy(() => import('./features/public/Legal'))

/** Everything under /app lives in the responsive shell (bottom bar · side rail · top bar). */
function AppPages() {
  const { pathname } = useLocation()
  useEffect(() => { document.title = 'Việc Thời Vụ' }, [])
  useEffect(() => { document.querySelector('.main')?.scrollTo(0, 0) }, [pathname])
  return (
    <Shell>
      <Routes>
        <Route index element={<Jobs />} />
        <Route path="viec-lam" element={<Navigate to="/app" replace />} />
        <Route path="viec/:id" element={<Jobs />} />
        <Route path="cham-cong" element={<Shifts />} />
        <Route path="thu-nhap" element={<Income />} />
        <Route path="da-ung-tuyen" element={<MyApplications />} />
        <Route path="tai-khoan" element={<Account />} />
        <Route path="tin-cua-toi" element={<EmployerJobs />} />
        <Route path="tin/:id" element={<EmployerJobs />} />
        <Route path="thong-bao" element={<Notifications />} />
        <Route path="ung-vien" element={<EmployerCandidates />} />
        <Route path="tim-nguoi" element={<FindWorkers />} />
        <Route path="da-luu" element={<Saved />} />
        <Route path="ca-lam" element={<EmployerShifts />} />
        <Route path="chi-phi" element={<Spend />} />
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
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SessionProvider>
          <Router {...routerProps}>
            <AppRoutes />
          </Router>
        </SessionProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
