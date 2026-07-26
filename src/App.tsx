import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import ToastContainer from './components/shared/ToastContainer'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Loader from './components/shared/Loader'
import HomePage from './routes/HomePage'

// Lazy-loaded: HomePage is the landing page for a freshly authenticated
// session and stays eager, but everything else can wait for its own chunk.
const LoginPage = lazy(() => import('./routes/LoginPage'))
const RepoListPage = lazy(() => import('./routes/RepoListPage'))
const DiscoveryPage = lazy(() => import('./routes/DiscoveryPage'))
const OrganizationsPage = lazy(() => import('./routes/OrganizationsPage'))
const DeploymentsPage = lazy(() => import('./routes/DeploymentsPage'))
const NotesPage = lazy(() => import('./routes/NotesPage'))
const IssuesPage = lazy(() => import('./routes/IssuesPage'))
const RecentItemsPage = lazy(() => import('./routes/RecentItemsPage'))

function AuthGate({ children }: { children: React.ReactNode }) {
  const account = useAuthStore((s) => s.currentAccount())
  if (!account) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-6 py-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="p-6">
              <Loader label="Loading…" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <AuthGate>
                  <HomePage />
                </AuthGate>
              }
            />
            <Route
              path="/repos"
              element={
                <AuthGate>
                  <RepoListPage />
                </AuthGate>
              }
            />
            <Route
              path="/discovery"
              element={
                <AuthGate>
                  <DiscoveryPage />
                </AuthGate>
              }
            />
            <Route
              path="/organizations"
              element={
                <AuthGate>
                  <OrganizationsPage />
                </AuthGate>
              }
            />
            <Route
              path="/deployments"
              element={
                <AuthGate>
                  <DeploymentsPage />
                </AuthGate>
              }
            />
            <Route
              path="/notes"
              element={
                <AuthGate>
                  <NotesPage />
                </AuthGate>
              }
            />
            <Route
              path="/issues"
              element={
                <AuthGate>
                  <IssuesPage />
                </AuthGate>
              }
            />
            <Route
              path="/recent"
              element={
                <AuthGate>
                  <RecentItemsPage />
                </AuthGate>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastContainer />
    </>
  )
}
