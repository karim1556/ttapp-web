import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Server } from 'lucide-react'
import { FormField } from '../components/FormField'
import { Modal } from '../components/Modal'
import { useAuth } from '../auth/AuthProvider'
import { getServerUrl, normalizeServerUrl, setServerUrl } from '../settings/serverUrl'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [serverUrl, setServerUrlState] = useState(getServerUrl())
  const [serverDraft, setServerDraft] = useState(getServerUrl())
  const [serverError, setServerError] = useState<string | null>(null)
  const [showServerModal, setShowServerModal] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveServer = () => {
    setServerError(null)
    const normalized = normalizeServerUrl(serverDraft)
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      setServerError('Server URL must start with http:// or https://')
      return
    }
    const saved = setServerUrl(normalized)
    setServerUrlState(saved)
    setShowServerModal(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute left-[-80px] top-[-120px] h-[260px] w-[260px] rounded-full bg-brand/20" />
      <div className="absolute right-[-60px] top-[160px] h-[220px] w-[220px] rounded-full bg-secondary/20" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-[#79A1FF] shadow-soft">
            <CalendarDays className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Welcome Back</h1>
            <p className="text-sm text-ink-muted">
              Sign in to continue to TT Manager
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white/95 p-6 shadow-soft">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">Account Login</h2>
            <p className="text-sm text-ink-muted">Use your college credentials</p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <FormField
              label="Email"
              name="email"
              type="email"
              value={email}
              placeholder="faculty@college.edu"
              onChange={setEmail}
            />
            <FormField
              label="Password"
              name="password"
              type="password"
              value={password}
              placeholder="••••••••"
              onChange={setPassword}
            />
            {error ? (
              <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}
            <button
              type="submit"
              className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-semibold text-brand"
              onClick={() => {
                setServerDraft(serverUrl)
                setShowServerModal(true)
              }}
              disabled={isSubmitting}
            >
              <Server className="h-4 w-4" />
              Change Server URL
            </button>
            <p className="text-xs text-ink-muted">{serverUrl}</p>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Contact your admin if you need access.
        </p>
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
    </div>
  )
}
