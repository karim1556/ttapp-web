import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, RefreshCcw, Sun, Wind, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUpcoming } from '../api/holidays'
import { getAll as getSubstitutions } from '../api/substitutions'
import { getToday, getFacultyTimetable } from '../api/timetable'
import { EmptyState } from '../components/EmptyState'
import { LectureDetailModal } from '../components/LectureDetailModal'
import { LoadingScreen } from '../components/LoadingScreen'
import { TimetableSlotCard } from '../components/TimetableSlotCard'
import { useAuth } from '../auth/AuthProvider'
import { UserRole } from '../types/auth'
import type { Holiday } from '../types/holiday'
import type { TimetableSlot } from '../types/timetable'
import { formatDateLong, formatDayName } from '../utils/date'
import { applyApprovedSubstitutions } from '../utils/substitutions'
import { collapseConsecutiveLabSlots } from '../utils/timetable'

export const TodayPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.user_type === UserRole.Admin
  const isFaculty = user?.user_type === UserRole.Faculty

  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [holiday, setHoliday] = useState<Holiday | null>(null)
  const [loading, setLoading] = useState(!isAdmin)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)

  const today = useMemo(() => new Date(), [])
  const dayName = formatDayName(today)
  const dateLabel = formatDateLong(today)
  const isWeekend = today.getDay() === 0 || today.getDay() === 6
  const lectureCount = slots.filter((slot) => slot.lectures.length > 0).length

  const loadSchedule = () => {
    if (isAdmin) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const dateKey = today.toISOString().slice(0, 10)

    if (isFaculty && user) {
      Promise.all([
        getFacultyTimetable(user.uid),
        getSubstitutions({ date: dateKey, status: 'approved' }),
        getUpcoming(),
      ])
        .then(([facultyTimetableData, substitutions, holidays]) => {
          // facultyTimetableData is mapped day-wise
          const dayData = (facultyTimetableData as any)[dayName]
          const filledSlots = dayData?.slots ?? []
          const withSubs = applyApprovedSubstitutions(
            filledSlots,
            substitutions,
            today,
          )
          setSlots(collapseConsecutiveLabSlots(withSubs))
          const todayHoliday = holidays.find(
            (item) => item.isToday || item.date === dateKey,
          )
          setHoliday(todayHoliday ?? null)
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to load today'
          setError(message)
        })
        .finally(() => setLoading(false))
    } else {
      Promise.all([
        getToday(),
        getSubstitutions({ date: dateKey, status: 'approved' }),
        getUpcoming(),
      ])
        .then(([days, substitutions, holidays]) => {
          const todayDay = days[0]
          const filledSlots = todayDay?.slots ?? []
          const withSubs = applyApprovedSubstitutions(
            filledSlots,
            substitutions,
            today,
          )
          setSlots(collapseConsecutiveLabSlots(withSubs))
          const todayHoliday = holidays.find(
            (item) => item.isToday || item.date === dateKey,
          )
          setHoliday(todayHoliday ?? null)
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to load today'
          setError(message)
        })
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Today</p>
          <h1 className="text-2xl font-semibold text-ink">{isAdmin ? 'Today' : 'My Day'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={loadSchedule}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#5E87F7] to-[#79A1FF] px-5 py-4 text-white shadow-soft">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/20 p-3">
            <CalendarDays className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">{dayName}</div>
            <div className="text-sm text-white/80">{dateLabel}</div>
          </div>
          {!isAdmin ? (
            <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {lectureCount} slot{lectureCount === 1 ? '' : 's'}
            </div>
          ) : null}
        </div>
      </div>

      {isAdmin ? (
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="Admin View"
          subtitle="Use the Timetable screen to view all class timetables with branch, semester, and division details."
        />
      ) : loading ? (
        <LoadingScreen label="Loading schedule..." />
      ) : error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : isWeekend ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            It&apos;s the weekend — no lectures!
          </div>
        </div>
      ) : holiday ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Holiday: {holiday.name}
          </div>
          <div className="mt-1 text-xs text-error/80">No lectures today.</div>
        </div>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No schedule for today"
          subtitle={`Timetable for ${dayName} hasn't been set up yet.`}
        />
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Schedule — {dayName}</h2>
            <button
              type="button"
              onClick={loadSchedule}
              className="text-sm font-semibold text-brand outline-none"
            >
              Refresh
            </button>
          </div>
          {slots.map((slot) => (
            <TimetableSlotCard
              key={slot.id}
              slot={slot}
              onClick={slot.lectures.length ? () => setSelectedSlot(slot) : undefined}
            />
          ))}
        </div>
      )}

      <LectureDetailModal
        slot={selectedSlot}
        isOpen={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
      />
    </div>
  )
}
