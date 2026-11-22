import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from '@/lib/session'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import DashboardPage from '@/pages/dashboard'

function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground" role="status">
      Loading...
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, isLoading } = useSession()
  if (isLoading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestOnly({ children }) {
  const { user, isLoading } = useSession()
  if (isLoading) return <FullPageLoader />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
