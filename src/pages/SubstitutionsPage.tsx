import { useEffect, useState } from 'react'
import { RefreshCcw, Check, X } from 'lucide-react'
import { getAll, approve } from '../api/substitutions'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import type { SubstitutionRecord } from '../types/substitution'

export const SubstitutionsPage = () => {
  const [records, setRecords] = useState<SubstitutionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getAll()
      .then((data) => setRecords(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleApprove = async (id: number) => {
    try {
      await approve(id)
      load()
    } catch {
      // ignore
    }
  }

  if (loading) return <LoadingScreen label="Loading substitutions..." />

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Substitutions</p>
          <h1 className="text-2xl font-semibold text-ink">Manage Substitutions</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {records.length === 0 ? (
        <EmptyState title="No substitutions" subtitle="No records found." icon={<X className="h-6 w-6" />} />
      ) : (
        <div className="grid gap-3">
          {records.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink">{r.subjectName || r.subjectCode}</div>
                  <div className="text-xs text-ink-muted">{r.date} · {r.dayName}</div>
                  <div className="text-xs text-ink-muted">From: {r.originalFacultyName} · To: {r.substituteFacultyName}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'pending' ? (
                    <button
                      type="button"
                      className="rounded-xl bg-brand px-3 py-1 text-sm font-semibold text-white"
                      onClick={() => handleApprove(r.id)}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="text-xs text-ink-muted">{r.status}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SubstitutionsPage