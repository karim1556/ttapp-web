import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutGrid,
  RefreshCcw,
  Shield,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getStats } from '../api/admin'
import { getAll as getFaculty } from '../api/faculty'
import { getAll as getSubjects } from '../api/subjects'
import { getAll as getTimeslots } from '../api/timeslots'
import { generate, generateAll, getWeekly } from '../api/timetable'
import { LoadingOverlay } from '../components/LoadingOverlay'
import { SectionTitle } from '../components/SectionTitle'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../auth/AuthProvider'
import type { AdminStats } from '../types/admin'
import type { TimetableDay } from '../types/timetable'
import type { ReactNode } from 'react'
import { UserRole } from '../types/auth'
import { academicYearOptions, currentAcademicYear } from '../utils/academicYear'
import { branchMap } from '../utils/branch'

export const AdminPanelPage = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [facultyCount, setFacultyCount] = useState(0)
  const [subjectCount, setSubjectCount] = useState(0)
  const [activeTimeslotCount, setActiveTimeslotCount] = useState(0)
  const [weekly, setWeekly] = useState<TimetableDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setGenerating] = useState(false)
  const [generateMessage, setGenerateMessage] = useState<string | null>(null)

  const [academicYear, setAcademicYear] = useState(currentAcademicYear())
  const [branchId, setBranchId] = useState(1)
  const [termType, setTermType] = useState<'Odd' | 'Even'>('Odd')
  const [singleSemester, setSingleSemester] = useState(1)
  const [division, setDivision] = useState('A')
  const [force, setForce] = useState(false)

  const loadAll = () => {
    setLoading(true)
    setError(null)
    Promise.all([getStats(), getFaculty(), getSubjects(), getTimeslots(), getWeekly()])
      .then(([statsData, facultyData, subjectData, timeslotData, weeklyData]) => {
        setStats(statsData)
        setFacultyCount(facultyData.length)
        setSubjectCount(subjectData.length)
        setActiveTimeslotCount(
          timeslotData.filter((slot) => slot.is_active !== 0 && slot.is_break !== 1).length,
        )
        setWeekly(weeklyData)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load admin data'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAll()
  }, [])

  const workload = useMemo(() => {
    const counts = new Map<string, number>()
    weekly.forEach((day) => {
      day.slots.forEach((slot) => {
        slot.lectures.forEach((lecture) => {
          if (!lecture.faculty_name) return
          counts.set(lecture.faculty_name, (counts.get(lecture.faculty_name) ?? 0) + 1)
        })
      })
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [weekly])

  const handleGenerateAll = async () => {
    setGenerating(true)
    setGenerateMessage(null)
    try {
      const res = await generateAll({
        academicYear,
        branchIds: [branchId],
        divisions: ['A', 'B'],
        termType,
        force,
      })
      setGenerateMessage(res.message ?? 'Generation completed.')
      loadAll()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setGenerateMessage(message)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateSingle = async () => {
    setGenerating(true)
    setGenerateMessage(null)
    try {
      const res = await generate({
        academicYear,
        branchId,
        sem: String(singleSemester),
        division,
        force,
      })
      setGenerateMessage(res.message ?? 'Generation completed.')
      loadAll()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setGenerateMessage(message)
    } finally {
      setGenerating(false)
    }
  }

  if (user && user.user_type !== UserRole.Admin) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
        Access denied.
      </div>
    )
  }

  return (
    <LoadingOverlay isLoading={isGenerating} message="Generating timetable...">
      <div className="grid gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
            <h1 className="text-2xl font-semibold text-ink">Admin Workspace</h1>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#5E87F7] to-[#79A1FF] px-5 py-4 text-white">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/20 p-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">
                {(user?.email ?? 'admin').split('@')[0]}
              </div>
              <div className="text-sm text-white/80">
                {facultyCount} teachers · {subjectCount} subjects · {activeTimeslotCount} slots
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Teachers"
            value={stats?.totalTeachers ?? (loading ? '...' : facultyCount)}
            hint="Active faculty"
          />
          <StatCard
            label="Subjects"
            value={stats?.totalSubjects ?? (loading ? '...' : subjectCount)}
            hint="Courses"
          />
          <StatCard
            label="Timetable days"
            value={stats?.totalTimetableDays ?? (loading ? '...' : weekly.length)}
            hint="Generated rows"
          />
          <StatCard
            label="Holidays"
            value={stats?.totalHolidays ?? (loading ? '...' : '—')}
            hint="Calendar"
          />
        </div>

        <div className="grid gap-6">
          <SectionTitle
            title="Timetable Generation"
            subtitle="Generate even/odd term schedules for A and B divisions"
          />
          <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3">
                <div className="text-sm font-semibold text-ink">Generate all (Odd/Even)</div>
                <label className="grid gap-1 text-xs text-ink-muted">
                  Academic Year
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
                    value={academicYear}
                    onChange={(event) => setAcademicYear(event.target.value)}
                  >
                    {academicYearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-ink-muted">
                  Branch
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
                    value={branchId}
                    onChange={(event) => setBranchId(Number(event.target.value))}
                  >
                    {Object.entries(branchMap).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-ink-muted">
                  Term Type
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
                    value={termType}
                    onChange={(event) =>
                      setTermType(event.target.value === 'Even' ? 'Even' : 'Odd')
                    }
                  >
                    <option value="Odd">Odd Term</option>
                    <option value="Even">Even Term</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={force}
                    onChange={(event) => setForce(event.target.checked)}
                  />
                  Force regenerate (overwrite existing)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAll}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
                >
                  Generate All
                </button>
              </div>
              <div className="grid gap-3">
                <div className="text-sm font-semibold text-ink">Generate single class</div>
                <label className="grid gap-1 text-xs text-ink-muted">
                  Semester
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
                    value={singleSemester}
                    onChange={(event) => setSingleSemester(Number(event.target.value))}
                  >
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => (
                      <option key={sem} value={sem}>
                        Sem {sem}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-ink-muted">
                  Division
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
                    value={division}
                    onChange={(event) => setDivision(event.target.value)}
                  >
                    {['A', 'B'].map((div) => (
                      <option key={div} value={div}>
                        Div {div}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSingle}
                  className="rounded-xl border border-brand bg-brand/10 px-4 py-2 text-sm font-semibold text-brand"
                >
                  Generate Single
                </button>
              </div>
            </div>
            {generateMessage ? (
              <div className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink">
                {generateMessage}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3">
          <SectionTitle
            title="Management"
            subtitle="Configure faculty, subjects, rooms and reports"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminTile
              title="Teachers"
              subtitle="Manage faculty"
              icon={<Users className="h-5 w-5" />}
              to="/admin/teachers"
            />
            <AdminTile
              title="Subjects"
              subtitle="Course mapping"
              icon={<BookOpen className="h-5 w-5" />}
              to="/admin/subjects"
            />
            <AdminTile
              title="Timetable"
              subtitle="Weekly view"
              icon={<LayoutGrid className="h-5 w-5" />}
              to="/timetable"
            />
            <AdminTile
              title="Substitutions"
              subtitle="Day-only replacements"
              icon={<CalendarCheck className="h-5 w-5" />}
              to="/substitutions"
            />
            <AdminTile
              title="COPO"
              subtitle="Outcome mapping"
              icon={<GraduationCap className="h-5 w-5" />}
              to="/copo"
            />
            <AdminTile
              title="Rooms"
              subtitle="Labs & classes"
              icon={<FileText className="h-5 w-5" />}
              to="/admin/rooms"
            />
            <AdminTile
              title="Room Reports"
              subtitle="Usage insights"
              icon={<ClipboardList className="h-5 w-5" />}
              to="/admin/rooms/reports"
            />
            <AdminTile
              title="Time Slots"
              subtitle="Periods & breaks"
              icon={<FileText className="h-5 w-5" />}
              to="/admin/timeslots"
            />
          </div>
        </div>

        {workload.length ? (
          <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
            <div className="text-lg font-semibold text-ink">Teacher Workload Report</div>
            <p className="text-sm text-ink-muted">Lectures assigned this week</p>
            <div className="mt-3 grid gap-2">
              {workload.slice(0, 10).map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2 text-sm"
                >
                  <span className="font-semibold text-ink">{name}</span>
                  <span className="text-ink-muted">{count} lectures</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </LoadingOverlay>
  )
}

const AdminTile = ({
  title,
  subtitle,
  icon,
  to,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  to: string
}) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:shadow"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
      {icon}
    </span>
    <span className="flex-1">
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="block text-xs text-ink-muted">{subtitle}</span>
    </span>
    <ChevronRight className="h-4 w-4 text-ink-muted" />
  </Link>
)
