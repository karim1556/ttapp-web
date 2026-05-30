import { useEffect, useMemo, useState } from 'react'
import { CalendarHeart, RefreshCcw } from 'lucide-react'
import { getAll } from '../api/holidays'
import { EmptyState } from '../components/EmptyState'
import { LoadingScreen } from '../components/LoadingScreen'
import type { Holiday } from '../types/holiday'
import { formatDateShort } from '../utils/date'

const monthKey = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)

export const HolidaysPage = () => {
  const [tab, setTab] = useState<'upcoming' | 'all'>('upcoming')
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHolidays = () => {
    setLoading(true)
    setError(null)
    getAll()
      .then((data) => setHolidays(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load holidays'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadHolidays()
  }, [])

  const todayKey = new Date().toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    if (tab === 'all') return holidays
    return holidays.filter((holiday) => holiday.date >= todayKey)
  }, [holidays, tab, todayKey])

  const grouped = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    filtered.forEach((holiday) => {
      const date = new Date(holiday.date)
      const key = monthKey(date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)?.push(holiday)
    })
    return map
  }, [filtered])

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Calendar</p>
          <h1 className="text-2xl font-semibold text-ink">Holiday Calendar</h1>
        </div>
        <button
          type="button"
          onClick={loadHolidays}
          className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#5E87F7] to-[#79A1FF] px-5 py-4 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/20 p-3">
            <CalendarHeart className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold">
              {tab === 'upcoming' ? 'Upcoming Holidays' : 'All Holidays'}
            </div>
            <div className="text-sm text-white/80">{filtered.length} entries</div>
          </div>
        </div>
      </div>

      <div className="flex rounded-2xl border border-border bg-white p-1">
        {([
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'all', label: 'All' },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === item.key
                ? 'bg-brand text-white'
                : 'text-ink-muted hover:bg-brand/10'
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingScreen label="Loading holidays..." />
      ) : error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarHeart className="h-6 w-6" />}
          title={tab === 'upcoming' ? 'No upcoming holidays' : 'No holidays found'}
          subtitle="Check back later."
        />
      ) : (
        <div className="grid gap-4">
          {[...grouped.entries()].map(([month, entries]) => (
            <div key={month} className="grid gap-2">
              <div className="text-sm font-semibold text-brand">{month}</div>
              {entries.map((holiday) => {
                const date = new Date(holiday.date)
                const type = holiday.type ?? 'Holiday'
                const isToday = holiday.isToday || holiday.date === todayKey
                return (
                  <div
                    key={holiday.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3"
                  >
                    <div className="w-14 text-center">
                      <div className="text-lg font-semibold text-ink">
                        {date.getDate()}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {holiday.name}
                        </span>
                        {isToday ? (
                          <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-semibold text-white">
                            Today
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {formatDateShort(date)} · {type}
                      </div>
                      {holiday.description ? (
                        <div className="mt-1 text-xs text-ink-muted">
                          {holiday.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
