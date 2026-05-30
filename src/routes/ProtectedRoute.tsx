import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LoadingScreen } from '../components/LoadingScreen'

export const ProtectedRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen label="Checking session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
