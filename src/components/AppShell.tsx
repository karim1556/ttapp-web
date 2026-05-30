import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarDays,
  Home,
  LayoutGrid,
  Shield,
  User,
  Sun,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { UserRole } from '../types/auth'

const adminNav = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Timetable', to: '/timetable', icon: LayoutGrid },
  { label: 'Today', to: '/today', icon: CalendarDays },
  { label: 'Admin', to: '/admin', icon: Shield },
  { label: 'Profile', to: '/profile', icon: User },
]

const regularNav = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Timetable', to: '/timetable', icon: LayoutGrid },
  { label: 'Today', to: '/today', icon: CalendarDays },
  { label: 'Holidays', to: '/holidays', icon: Sun },
  { label: 'Profile', to: '/profile', icon: User },
]

export const AppShell = () => {
  const { user } = useAuth()
  const role = user?.user_type ?? UserRole.Student
  const navItems = role === UserRole.Admin ? adminNav : regularNav

  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />

      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between rounded-3xl border border-border bg-white px-3 py-2 shadow-soft">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-w-[56px] flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-brand/15 text-brand'
                    : 'text-ink-muted hover:bg-brand/10'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
