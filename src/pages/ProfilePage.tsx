import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bell,
  Building,
  CalendarClock,
  ChevronRight,
  LogOut,
  Shield,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { useAuth } from '../auth/AuthProvider'
import { UserRole } from '../types/auth'
import { getServerUrl, normalizeServerUrl, setServerUrl } from '../settings/serverUrl'

export const ProfilePage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.user_type === UserRole.Admin
  const isFaculty = user?.user_type === UserRole.Faculty

  const initial = useMemo(() => {
    const email = user?.email ?? 'U'
    return email.charAt(0).toUpperCase()
  }, [user?.email])

  const [showServerModal, setShowServerModal] = useState(false)
  const [serverDraft, setServerDraft] = useState(getServerUrl())
  const [serverError, setServerError] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleSaveServer = () => {
    setServerError(null)
    const normalized = normalizeServerUrl(serverDraft)
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      setServerError('Server URL must start with http:// or https://')
      return
    }
    setServerUrl(normalized)
    setShowServerModal(false)
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Profile</p>
          <h1 className="text-2xl font-semibold text-ink">My Profile</h1>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#5E87F7] to-[#7EA4FF] px-5 py-5 text-white shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-semibold">
            {initial}
          </div>
          <div>
            <div className="text-lg font-semibold">
              {(user?.email ?? 'User').split('@')[0]}
            </div>
            <div className="text-sm text-white/80">{user?.email ?? '—'}</div>
            <div className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {user?.user_type ?? '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4">
        <h2 className="text-sm font-semibold text-ink">Account Details</h2>
        <div className="mt-3 grid gap-3 text-sm text-ink-muted">
          <div className="flex items-center justify-between">
            <span>Email</span>
            <span className="font-semibold text-ink">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Role</span>
            <span className="font-semibold text-ink">{user?.user_type ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>User ID</span>
            <span className="font-semibold text-ink">{user?.uid ?? '—'}</span>
          </div>
        </div>
      </div>

      {isFaculty ? (
        <div className="rounded-2xl border border-border bg-white">
          <OptionRow
            icon={<SlidersHorizontal className="h-4 w-4" />}
            title="My Scheduling Constraints"
            subtitle="Set workload, unavailable and preferred slots"
            onClick={() => navigate('/constraints')}
          />
        </div>
      ) : null}

      {isAdmin ? (
        <div className="rounded-2xl border border-border bg-white">
          <OptionRow
            icon={<Shield className="h-4 w-4" />}
            title="Admin Panel"
            subtitle="Manage teachers, subjects and timetable"
            onClick={() => navigate('/admin')}
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-white">
        <OptionRow
          icon={<CalendarClock className="h-4 w-4" />}
          title="Substitutions"
          subtitle="Day-only replacement records"
          onClick={() => navigate('/substitutions')}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white">
        <OptionRow
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          subtitle="In-app alerts and history"
          onClick={() => navigate('/notifications')}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white">
        <OptionRow
          icon={<Building className="h-4 w-4" />}
          title="Server URL"
          subtitle={getServerUrl()}
          onClick={() => {
            setServerDraft(getServerUrl())
            setShowServerModal(true)
          }}
        />
      </div>

      <div className="rounded-2xl border border-border bg-white">
        <OptionRow
          icon={<Wrench className="h-4 w-4" />}
          title="App Version"
          subtitle="1.0.0"
        />
      </div>

      <div className="rounded-2xl border border-border bg-white">
        <OptionRow
          icon={<LogOut className="h-4 w-4" />}
          title="Sign Out"
          subtitle="End current session"
          danger
          onClick={() => setShowLogoutModal(true)}
        />
      </div>

      <Modal
        isOpen={showServerModal}
        title="Server URL"
        onClose={() => setShowServerModal(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm"
              onClick={() => setShowServerModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
              onClick={handleSaveServer}
            >
              Save
            </button>
          </>
        }
      >
        <label className="grid gap-2 text-sm text-ink">
          Server URL
          <input
            className="rounded-xl border border-border px-4 py-2"
            value={serverDraft}
            placeholder="http://192.168.x.y:3000/api"
            onChange={(event) => setServerDraft(event.target.value)}
          />
        </label>
        {serverError ? (
          <div className="mt-3 text-xs text-error">{serverError}</div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showLogoutModal}
        title="Sign out"
        onClose={() => setShowLogoutModal(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white"
              onClick={() => logout()}
            >
              Sign out
            </button>
          </>
        }
      >
        <p className="text-sm text-ink">Are you sure you want to sign out?</p>
      </Modal>
    </div>
  )
}

const OptionRow = ({
  icon,
  title,
  subtitle,
  onClick,
  danger,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  onClick?: () => void
  danger?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-3 px-4 py-3 text-left"
  >
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
        danger ? 'bg-error/10 text-error' : 'bg-brand-light text-brand'
      }`}
    >
      {icon}
    </span>
    <span className="flex-1">
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="block text-xs text-ink-muted">{subtitle}</span>
    </span>
    {onClick ? <ChevronRight className="h-4 w-4 text-ink-muted" /> : null}
  </button>
)
