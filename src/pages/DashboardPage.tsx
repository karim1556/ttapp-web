import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid3X3,
  Calendar,
  Sun,
  Settings,
  School,
  ChevronRight,
  CheckCircle,
  Sparkles,
  MapPin,
  User,
  CalendarDays,
} from 'lucide-react'
import { getUpcoming as getUpcomingHolidays } from '../api/holidays'
import { getAll as getSubstitutions } from '../api/substitutions'
import { getToday } from '../api/timetable'
import { useAuth } from '../auth/AuthProvider'
import { UserRole } from '../types/auth'
import type { TimetableSlot } from '../types/timetable'
import type { Holiday } from '../types/holiday'
import { formatDateLong, formatDateShort } from '../utils/date'
import { applyApprovedSubstitutions } from '../utils/substitutions'
import { collapseConsecutiveLabSlots } from '../utils/timetable'

const slotStartMinutes = (slot: TimetableSlot) =>
  (slot.startTimeHr ?? 0) * 60 + (slot.startTimeMinutes ?? 0)

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.user_type ?? UserRole.Student
  const isAdmin = role === UserRole.Admin
  const isFaculty = role === UserRole.Faculty

  const [todaySlots, setTodaySlots] = useState<TimetableSlot[]>([])
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [holidayLoading, setHolidayLoading] = useState(false)

  useEffect(() => {
    setScheduleLoading(true)
    Promise.all([
      getToday(),
      getSubstitutions({ date: new Date().toISOString().slice(0, 10), status: 'approved' }),
    ])
      .then(([days, substitutions]) => {
        const todayDay = days[0] ?? null
        const slots = todayDay?.slots ?? []
        const withSubs = applyApprovedSubstitutions(slots, substitutions, new Date())
        setTodaySlots(collapseConsecutiveLabSlots(withSubs))
      })
      .catch(() => setScheduleError('Failed to load'))
      .finally(() => setScheduleLoading(false))
  }, [])

  useEffect(() => {
    setHolidayLoading(true)
    getUpcomingHolidays()
      .then((data) => setHolidays(data))
      .catch(() => {})
      .finally(() => setHolidayLoading(false))
  }, [])

  const nextSlot = useMemo(() => {
    if (!todaySlots.length) return null
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return todaySlots.find(
      (slot) => slot.lectures.length > 0 && slotStartMinutes(slot) >= nowMinutes,
    )
  }, [todaySlots])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning!' : hour < 17 ? 'Good Afternoon!' : 'Good Evening!'
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateFormatted = formatDateLong(new Date())
  const adminName = (user?.email ?? 'user').split('@')[0]

  return (
    <div className="grid gap-4 px-4 py-4">
      {/* Greeting Card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#5E87F7] to-[#3D69D9] px-5 py-5 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-white/70 font-medium">{greeting}</p>
            <h1 className="mt-1 text-2xl font-bold capitalize">
              Hi, {adminName.charAt(0).toUpperCase() + adminName.slice(1)}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
              <CalendarDays className="h-4 w-4" />
              <span>{todayName}, {dateFormatted}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/20 p-4">
            <School className="h-10 w-10 text-white/70" />
          </div>
        </div>
      </div>

      {/* Today Holiday Banner */}
      {holidays.length > 0 && holidays[0]?.date === new Date().toISOString().slice(0, 10) ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Sun className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-semibold text-red-600 text-sm">Today is a Holiday</p>
              <p className="text-sm text-red-500">{holidays[0].name}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Next Lecture Card */}
      <div className={`rounded-2xl border ${nextSlot ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'} px-4 py-4`}>
        {nextSlot ? (
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-brand">
              <Sparkles className="h-4 w-4" />
              Next Lecture
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-brand">
                {String(nextSlot.startTimeHr ?? 0).padStart(2, '0')}:{String(nextSlot.startTimeMinutes ?? 0).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {nextSlot.lectures[0]?.subject_name || nextSlot.lectures[0]?.subjectCode || 'Lecture'}
                </p>
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                  {nextSlot.lectures[0]?.faculty_name ? (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {nextSlot.lectures[0].faculty_name}
                    </span>
                  ) : null}
                  {nextSlot.lectures[0]?.room_number ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room {nextSlot.lectures[0].room_number}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span className="text-sm text-green-600 font-medium">
              {scheduleLoading ? 'Loading...' : scheduleError ? 'Error loading schedule' : 'No more lectures today'}
            </span>
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            icon={<Grid3X3 className="h-6 w-6" />}
            label="Weekly\nTimetable"
            color="#5E87F7"
            onClick={() => navigate('/timetable')}
          />
          <QuickActionCard
            icon={<Calendar className="h-6 w-6" />}
            label="Today's\nSchedule"
            color="#2F9E44"
            onClick={() => navigate('/today')}
          />
          <QuickActionCard
            icon={<Sun className="h-6 w-6" />}
            label="Upcoming\nHolidays"
            color="#E03131"
            onClick={() => navigate('/holidays')}
          />
          {isAdmin ? (
            <QuickActionCard
              icon={<Settings className="h-6 w-6" />}
              label="Admin\nPanel"
              color="#E67700"
              onClick={() => navigate('/admin')}
            />
          ) : isFaculty ? (
            <QuickActionCard
              icon={<Settings className="h-6 w-6" />}
              label="My\nConstraints"
              color="#14B8A6"
              onClick={() => navigate('/constraints')}
            />
          ) : (
            <QuickActionCard
              icon={<Sun className="h-6 w-6" />}
              label="Holidays"
              color="#E67700"
              onClick={() => navigate('/holidays')}
            />
          )}
        </div>
      </div>

      {/* Today's Schedule */}
      {!scheduleLoading && todaySlots.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Today — {todayName}</h2>
            <button
              onClick={() => navigate('/today')}
              className="text-sm font-semibold text-brand"
            >
              View All
            </button>
          </div>
          <div className="grid gap-2">
            {todaySlots.slice(0, 3).map((slot) => (
              <LectureCard key={slot.id} slot={slot} />
            ))}
          </div>
        </div>
      ) : scheduleLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">Loading schedule...</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No lectures scheduled today</p>
        </div>
      )}

      {/* Upcoming Holidays */}
      {holidays.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Holidays</h2>
            {!isAdmin ? (
              <button
                onClick={() => navigate('/holidays')}
                className="text-sm font-semibold text-brand"
              >
                View All
              </button>
            ) : null}
          </div>
          <div className="grid gap-2">
            {holidays.slice(0, 3).map((holiday) => (
              <HolidayChip key={holiday.id} holiday={holiday} />
            ))}
          </div>
        </div>
      ) : holidayLoading ? null : null}
    </div>
  )
}

const QuickActionCard = ({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="rounded-2xl border p-4 text-left transition hover:shadow-md"
    style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
  >
    <div style={{ color }} className="mb-2">
      {icon}
    </div>
    <p style={{ color }} className="text-sm font-semibold leading-tight whitespace-pre-line">
      {label}
    </p>
  </button>
)

const LectureCard = ({ slot }: { slot: TimetableSlot }) => {
  const lecture = slot.lectures[0]
  if (!lecture) return null

  const isLab = lecture.typeOfLecture?.toLowerCase() === 'lab'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center min-w-[48px]">
          <span className="text-xs text-gray-500">
            {String(slot.startTimeHr ?? 0).padStart(2, '0')}:{String(slot.startTimeMinutes ?? 0).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-400">-</span>
          <span className="text-xs text-gray-500">
            {String(slot.endTimeHr ?? 0).padStart(2, '0')}:{String(slot.endTimeMinutes ?? 0).padStart(2, '0')}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {lecture.subject_name || lecture.subjectCode || 'Lecture'}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            {lecture.faculty_name ? (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {lecture.faculty_name}
              </span>
            ) : null}
            {lecture.room_number ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {lecture.room_number}
              </span>
            ) : null}
            {isLab ? (
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700">
                Lab
              </span>
            ) : null}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}

const HolidayChip = ({ holiday }: { holiday: Holiday }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-red-100 p-2">
        <CalendarDays className="h-4 w-4 text-red-500" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{holiday.name}</p>
        <p className="text-xs text-gray-500">
          {holiday.date ? formatDateShort(new Date(holiday.date)) : ''}
        </p>
      </div>
      {holiday.type ? (
        <span className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-medium text-red-600">
          {holiday.type}
        </span>
      ) : null}
    </div>
  </div>
)

export default DashboardPage