import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { LoadingScreen } from '../components/LoadingScreen'
import { UserRole } from '../types/auth'

type RoleRouteProps = {
  allowed: UserRole[]
}

export const RoleRoute = ({ allowed }: RoleRouteProps) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen label="Loading access..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.user_type ?? UserRole.Student
  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
