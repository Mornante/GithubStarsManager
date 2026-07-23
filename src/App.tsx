import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import ToastContainer from './components/shared/ToastContainer'
import LoginPage from './routes/LoginPage'
import HomePage from './routes/HomePage'
import RepoListPage from './routes/RepoListPage'
import DiscoveryPage from './routes/DiscoveryPage'
import OrganizationsPage from './routes/OrganizationsPage'
import DeploymentsPage from './routes/DeploymentsPage'
import NotesPage from './routes/NotesPage'

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}
