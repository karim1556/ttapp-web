import { useEffect, useState } from 'react'
import { getStats } from '../api/admin'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import type { AdminStats } from '../types/admin'

export const AdminStatsPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getStats()
      .then((data) => setStats(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load stats'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="Admin stats"
        subtitle="System-level counts from the timetable backend."
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Teachers"
          value={stats?.totalTeachers ?? (isLoading ? '...' : '—')}
          hint="Active faculty"
        />
        <StatCard
          label="Subjects"
          value={stats?.totalSubjects ?? (isLoading ? '...' : '—')}
          hint="Courses"
        />
        <StatCard
          label="Timetable days"
          value={stats?.totalTimetableDays ?? (isLoading ? '...' : '—')}
          hint="Generated rows"
        />
        <StatCard
          label="Holidays"
          value={stats?.totalHolidays ?? (isLoading ? '...' : '—')}
          hint="Calendar"
        />
      </div>
    </div>
  )
}
