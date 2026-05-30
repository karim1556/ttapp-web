import { useEffect, useState } from 'react'
import { RefreshCcw, BarChart3 } from 'lucide-react'
import { getClassroomUsageReport } from '../api/timetable'
import { LoadingScreen } from '../components/LoadingScreen'
import { EmptyState } from '../components/EmptyState'
import type { ClassroomUsageReport } from '../types/report'
import { branchMap } from '../utils/branch'

export const RoomReportsPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ClassroomUsageReport | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getClassroomUsageReport()
      .then((data) => setReport(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load report'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingScreen label="Loading room reports..." />
  if (error) return <div className="text-sm text-error">Unable to load reports: {error}</div>

  const rooms = report?.rooms ?? []
  const slotsPerDay = report?.slotsPerDay ?? 0
  const totalSlots = report?.totalWeeklySlotsPerRoom ?? 0

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
          <h1 className="text-2xl font-semibold text-ink">Room Reports</h1>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white px-4 py-3">
          <div className="text-xs text-ink-muted">Slots per Day</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{slotsPerDay}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3">
          <div className="text-xs text-ink-muted">Weekly Slots per Room</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{totalSlots}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3">
          <div className="text-xs text-ink-muted">Total Rooms</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{rooms.length}</div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No data" subtitle="No classroom usage data available." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium text-right">Assigned</th>
                <th className="px-4 py-3 font-medium text-right">Capacity</th>
                <th className="px-4 py-3 font-medium text-right">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((row, idx) => (
                <tr key={row.roomId ?? idx} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink">{row.roomNumber}</td>
                  <td className="px-4 py-3 text-ink-muted">{row.roomType ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {row.branchId ? branchMap[row.branchId] ?? row.branchId : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {row.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink">{row.assignedLectures}</td>
                  <td className="px-4 py-3 text-right text-ink">{totalSlots}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${Math.min(row.utilizationPercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-ink">
                        {row.utilizationPercent.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RoomReportsPage