import { Link } from 'react-router-dom'

export const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center px-6">
    <div className="max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-[var(--shadow-soft)]">
      <h1 className="text-3xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Go back home
      </Link>
    </div>
  </div>
)
