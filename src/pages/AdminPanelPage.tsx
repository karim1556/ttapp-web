import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutGrid,
  RefreshCcw,
  Shield,
  Users,
  Sparkles,
  Settings,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Modal } from '../components/Modal'
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

  // Shared configuration parameters
  // Configuration parameters
  const [academicYear, setAcademicYear] = useState(currentAcademicYear())
  const [branchId, setBranchId] = useState(1)

  // Scope specific configuration parameters
  const [termType, setTermType] = useState<'Odd' | 'Even'>('Odd')
  const [singleSemester, setSingleSemester] = useState(1)
  const [division, setDivision] = useState('A')

  // Tab and Modal states
  const [activeTab, setActiveTab] = useState<'single' | 'full'>('single')
  const [issuesModal, setIssuesModal] = useState<string[] | null>(null)
  const [confirmOverwriteModal, setConfirmOverwriteModal] = useState<string[] | null>(null)

  const resetValidation = () => {
    setGenerateMessage(null)
  }

  const loadAll = (currentBranchId?: number) => {
    const targetBranchId = typeof currentBranchId === 'number' ? currentBranchId : branchId
    setLoading(true)
    setError(null)
    Promise.all([
      getStats(),
      getFaculty(),
      getSubjects(),
      getTimeslots({ branchId: targetBranchId }),
      getWeekly(),

    ])
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
    loadAll(branchId)
  }, [branchId])

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

  const handleGenerateAll = async (forceParam = false) => {
    setGenerating(true)
    setGenerateMessage(null)
    try {
      if (!forceParam) {
        const res = await generateAll({
          academicYear,
          branchIds: [branchId],
          divisions: ['A', 'B'],
          termType,
          force: false,
          dryRun: true,
        })
        const issues = (res as any).issues || []
        const existingClasses = (res as any).existingClasses || []

        if (issues.length > 0) {
          setIssuesModal(issues)
          setGenerating(false)
          return
        }

        if (existingClasses.length > 0) {
          setConfirmOverwriteModal(existingClasses)
          setGenerating(false)
          return
        }
      }

      const res = await generateAll({
        academicYear,
        branchIds: [branchId],
        divisions: ['A', 'B'],
        termType,
        force: forceParam,
        dryRun: false,
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

  const handleGenerateSingle = async (forceParam = false) => {
    setGenerating(true)
    setGenerateMessage(null)
    try {
      if (!forceParam) {
        const res = await generate({
          academicYear,
          branchId,
          sem: String(singleSemester),
          division,
          force: false,
          dryRun: true,
        })
        const issues = (res as any).issues || []
        const existingClasses = (res as any).existingClasses || []

        if (issues.length > 0) {
          setIssuesModal(issues)
          setGenerating(false)
          return
        }

        if (existingClasses.length > 0) {
          setConfirmOverwriteModal(existingClasses)
          setGenerating(false)
          return
        }
      }

      const res = await generate({
        academicYear,
        branchId,
        sem: String(singleSemester),
        division,
        force: forceParam,
        dryRun: false,
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
            onClick={() => loadAll(branchId)}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted transition hover:bg-gray-50 active:scale-95 outline-none"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#5E87F7] to-[#79A1FF] px-5 py-4 text-white shadow-soft">
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

        {/* Improved generation UI */}
        <div className="grid gap-6">
          <SectionTitle
            title="Timetable Generation Control"
            subtitle="Configure terms and trigger the scheduling algorithm for your department"
          />

          <div className="rounded-3xl border border-border bg-white p-5 shadow-soft grid gap-5">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-[#F8FAFC] border border-border rounded-2xl max-w-md">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('single')
                  resetValidation()
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all outline-none ${
                  activeTab === 'single'
                    ? 'bg-brand text-white shadow-soft font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Single Class
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('full')
                  resetValidation()
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all outline-none ${
                  activeTab === 'full'
                    ? 'bg-brand text-white shadow-soft font-bold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Full Department
              </button>
            </div>

            {/* Target Parameters based on Active Mode */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-border grid gap-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-4 w-4 text-brand" />
                <span className="text-sm font-bold text-ink uppercase tracking-wider">
                  {activeTab === 'single' ? 'Single Class Configuration' : 'Full Department Configuration'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
                <label className="grid gap-1.5 text-xs font-semibold text-ink-muted">
                  Academic Year
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none mt-1 hover:border-brand/40 transition focus:border-brand"
                    value={academicYear}
                    onChange={(event) => {
                      setAcademicYear(event.target.value)
                      resetValidation()
                    }}
                  >
                    {academicYearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-xs font-semibold text-ink-muted">
                  Department / Branch
                  <select
                    className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none mt-1 hover:border-brand/40 transition focus:border-brand"
                    value={branchId}
                    onChange={(event) => {
                      setBranchId(Number(event.target.value))
                      resetValidation()
                    }}
                  >
                    {Object.entries(branchMap).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                {activeTab === 'single' ? (
                  <>
                    <label className="grid gap-1.5 text-xs font-semibold text-ink-muted">
                      Semester
                      <select
                        className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none mt-1 hover:border-brand/40 transition focus:border-brand"
                        value={singleSemester}
                        onChange={(event) => {
                          setSingleSemester(Number(event.target.value))
                          resetValidation()
                        }}
                      >
                        {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => (
                          <option key={sem} value={sem}>
                            Sem {sem}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1.5 text-xs font-semibold text-ink-muted">
                      Division
                      <select
                        className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none mt-1 hover:border-brand/40 transition focus:border-brand"
                        value={division}
                        onChange={(event) => {
                          setDivision(event.target.value)
                          resetValidation()
                        }}
                      >
                        {['A', 'B'].map((div) => (
                          <option key={div} value={div}>
                            Div {div}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="grid gap-1.5 text-xs font-semibold text-ink-muted lg:col-span-2">
                      Term Type
                      <select
                        className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none mt-1 hover:border-brand/40 transition focus:border-brand"
                        value={termType}
                        onChange={(event) => {
                          setTermType(event.target.value as 'Odd' | 'Even')
                          resetValidation()
                        }}
                      >
                        <option value="Odd">Odd Semester (1, 3, 5, 7)</option>
                        <option value="Even">Even Semester (2, 4, 6, 8)</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex">
              <button
                type="button"
                onClick={() => (activeTab === 'single' ? handleGenerateSingle(false) : handleGenerateAll(false))}
                disabled={isGenerating}
                className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark active:scale-98 transition outline-none disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {activeTab === 'single' ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate Single Class Timetable
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Full Department Timetable
                  </>
                )}
              </button>
            </div>

            {generateMessage ? (
              <div className="rounded-2xl border border-border bg-[#F8FAFC] px-4 py-3 text-sm text-ink font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand animate-pulse" />
                <span>{generateMessage}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3">
          <SectionTitle
            title="Management"
            subtitle="Configure faculty, subjects, rooms, reports and temporary event calendars"
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
              title="Temporary Timetable"
              subtitle="Events & guest lectures"
              icon={<CalendarRange className="h-5 w-5" />}
              to="/admin/temporary"
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

      {/* Configure Before Generating Modal (Blocker Issues) */}
      <Modal
        isOpen={Boolean(issuesModal)}
        title="Configure Before Generating"
        onClose={() => setIssuesModal(null)}
        footer={
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-sm bg-white hover:bg-gray-50 transition outline-none"
            onClick={() => setIssuesModal(null)}
          >
            Close
          </button>
        }
      >
        <div className="grid gap-3">
          <p className="text-sm text-ink font-semibold">Please complete the following setup first:</p>
          <ul className="list-disc list-inside text-xs text-error space-y-2 bg-error/10 p-4 rounded-2xl border border-error/25">
            {issuesModal?.map((issue, idx) => (
              <li key={idx} className="leading-relaxed">{issue}</li>
            ))}
          </ul>
        </div>
      </Modal>

      {/* Existing Timetable Found Modal (Overwrite Confirmation) */}
      <Modal
        isOpen={Boolean(confirmOverwriteModal)}
        title="Existing Timetable Found"
        onClose={() => setConfirmOverwriteModal(null)}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm bg-white hover:bg-gray-50 transition outline-none"
              onClick={() => setConfirmOverwriteModal(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white hover:bg-error-dark transition outline-none"
              onClick={() => {
                const existing = confirmOverwriteModal
                setConfirmOverwriteModal(null)
                if (existing) {
                  if (activeTab === 'single') {
                    handleGenerateSingle(true)
                  } else {
                    handleGenerateAll(true)
                  }
                }
              }}
            >
              Delete & Regenerate
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <p className="text-sm text-ink leading-relaxed">
            Timetable already exists for the selected class(es). Regenerating will delete and replace previous assignments:
          </p>
          <div className="flex flex-wrap gap-1.5 p-3 bg-amber-50 rounded-2xl border border-amber-200">
            {confirmOverwriteModal?.map((entry, idx) => (
              <span
                key={idx}
                className="bg-amber-100 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-800 border border-amber-200"
              >
                {entry}
              </span>
            ))}
          </div>
          <p className="text-xs text-ink-muted leading-relaxed font-semibold">
            Are you sure you want to proceed? This cannot be undone.
          </p>
        </div>
      </Modal>
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
    className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:shadow-md hover:border-brand/30 group outline-none"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand group-hover:bg-brand/10 transition">
      {icon}
    </span>
    <span className="flex-1">
      <span className="block text-sm font-semibold text-ink group-hover:text-brand transition">{title}</span>
      <span className="block text-xs text-ink-muted">{subtitle}</span>
    </span>
    <ChevronRight className="h-4 w-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
  </Link>
)
