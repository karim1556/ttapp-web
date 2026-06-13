import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  FileDown,
  RefreshCcw,
  Shuffle,
  SlidersHorizontal,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAll as getFaculty } from '../api/faculty'
import { getAll as getSubjects } from '../api/subjects'
import { createSubstitution, preview } from '../api/substitutions'
import { getWeekly, updateSlot, getFacultyTimetable } from '../api/timetable'
import { useAuth } from '../auth/AuthProvider'
import { EmptyState } from '../components/EmptyState'
import { LectureDetailModal } from '../components/LectureDetailModal'
import { LoadingScreen } from '../components/LoadingScreen'
import { Modal } from '../components/Modal'
import { TimetableSlotCard } from '../components/TimetableSlotCard'
import type { Faculty } from '../types/faculty'
import type { Subject } from '../types/subject'
import type { DayOfWeek, TimetableDay, TimetableLecture, TimetableSlot } from '../types/timetable'
import { UserRole } from '../types/auth'
import { formatDateInput } from '../utils/date'
import { downloadCsv } from '../utils/csv'
import { downloadTimetablePdf } from '../utils/pdf'
import { collapseConsecutiveLabSlots, formatSlotRange } from '../utils/timetable'

const branches = { 1: 'CS', 2: 'IT', 3: 'EXTC', 4: 'Mech' } as const
const semesters = [1, 2, 3, 4, 5, 6, 7, 8]
const divisions = ['A', 'B']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const dayIndexToday = () => {
  const weekday = new Date().getDay()
  if (weekday >= 1 && weekday <= 5) return weekday - 1
  return 0
}

const getDayData = (weekly: TimetableDay[], dayName: string) =>
  weekly.find(
    (day) => day.dateOfWeek?.toLowerCase() === dayName.toLowerCase(),
  )

const nextDateForDay = (dayName: string) => {
  const dayMap: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  }
  const target = dayMap[dayName.toLowerCase()] ?? 1
  const now = new Date()
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  while (candidate.getDay() !== target || candidate < now) {
    candidate.setDate(candidate.getDate() + 1)
  }
  return candidate
}

export const TimetablePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.user_type === UserRole.Admin

  const [selectedDayIndex, setSelectedDayIndex] = useState(dayIndexToday())
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null)
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState(false)

  const [weekly, setWeekly] = useState<TimetableDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  const [editingLecture, setEditingLecture] = useState<TimetableLecture | null>(null)
  const [substitutionLecture, setSubstitutionLecture] =
    useState<TimetableLecture | null>(null)
  const [substitutionSlot, setSubstitutionSlot] =
    useState<TimetableSlot | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [subDate, setSubDate] = useState<Date | null>(null)
  const [subReason, setSubReason] = useState('')
  const [subPreview, setSubPreview] = useState<any[]>([])
  const [subPreviewLoading, setSubPreviewLoading] = useState(false)
  const [subSelectedFacultyId, setSubSelectedFacultyId] = useState<number | null>(null)
  const [subStatus, setSubStatus] = useState<string | null>(null)

  const selectedDayName = days[selectedDayIndex]
  const selectedDay = useMemo(
    () => getDayData(weekly, selectedDayName),
    [weekly, selectedDayName],
  )
  const visibleSlots = useMemo(
    () => collapseConsecutiveLabSlots(selectedDay?.slots ?? []),
    [selectedDay],
  )

  const loadTimetable = () => {
    setLoading(true)
    setError(null)

    const hasFilters = selectedBranch !== null || selectedSemester !== null || selectedDivision !== null

    if (user?.user_type === UserRole.Faculty && !hasFilters) {
      getFacultyTimetable(user.uid)
        .then((data: any) => {
          const daysArray = Object.entries(data).map(([dayName, dayData]: [string, any]) => ({
            id: dayData.timetable.id,
            dateOfWeek: dayName as DayOfWeek,
            slots: dayData.slots,
            branch_id: dayData.timetable.branch_id,
            sem: dayData.timetable.sem,
            division: dayData.timetable.division,
            academic_id: dayData.timetable.academic_id,
            fromDate: dayData.timetable.fromDate,
            toDate: dayData.timetable.toDate,
          }))
          setWeekly(daysArray)
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to load timetable'
          setError(message)
        })
        .finally(() => setLoading(false))
    } else {
      getWeekly({
        branchId: selectedBranch ?? undefined,
        sem: selectedSemester ? String(selectedSemester) : undefined,
        division: selectedDivision ?? undefined,
      })
        .then((data) => setWeekly(data))
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to load timetable'
          setError(message)
        })
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => {
    loadTimetable()
  }, [])

  const occupiedCount = (dayName: string) => {
    const day = getDayData(weekly, dayName)
    if (!day) return 0
    const slots = collapseConsecutiveLabSlots(day.slots)
    return slots.filter((slot) => slot.lectures.length > 0).length
  }

  const exportCsv = () => {
    if (!weekly.length) return
    const rows: string[][] = [
      ['Day', 'Start', 'End', 'Subject', 'Faculty', 'Room', 'Batch', 'Type'],
    ]
    weekly.forEach((day) => {
      day.slots.forEach((slot) => {
        slot.lectures.forEach((lecture) => {
          rows.push([
            day.dateOfWeek ?? 'Day',
            `${slot.startTimeHr ?? ''}:${String(slot.startTimeMinutes ?? 0).padStart(2, '0')}`,
            `${slot.endTimeHr ?? ''}:${String(slot.endTimeMinutes ?? 0).padStart(2, '0')}`,
            lecture.subject_name || lecture.subjectCode || '',
            lecture.faculty_name || '',
            lecture.room_number || '',
            lecture.batch || '',
            lecture.typeOfLecture || '',
          ])
        })
      })
    })
    downloadCsv('timetable.csv', rows)
  }

  const openEdit = async (lecture: TimetableLecture) => {
    setEditError(null)
    setEditingLecture(lecture)
    if (!subjects.length) {
      try {
        const data = await getSubjects()
        setSubjects(data)
      } catch {
        // non-blocking
      }
    }
    if (!faculty.length) {
      try {
        const data = await getFaculty()
        setFaculty(data)
      } catch {
        // non-blocking
      }
    }
  }

  const openSubstitution = async (lecture: TimetableLecture, slot: TimetableSlot) => {
    setSubstitutionLecture(lecture)
    setSubstitutionSlot(slot)
    const nextDate = nextDateForDay(selectedDayName)
    setSubDate(nextDate)
    setSubReason('')
    setSubStatus(null)
    setSubPreview([])
    setSubSelectedFacultyId(null)
    await runPreview(lecture, slot, nextDate)
  }

  const runPreview = async (
    lecture: TimetableLecture,
    slot: TimetableSlot,
    date: Date,
  ) => {
    setSubPreviewLoading(true)
    setSubStatus(null)
    try {
      const candidates = await preview({
        lectureId: lecture.id,
        slotId: slot.id,
        dayName: selectedDayName,
        date: date.toISOString().slice(0, 10),
        unavailableFacultyId: lecture.facultyid ?? undefined,
      })
      const list = Array.isArray(candidates) ? candidates : []
      setSubPreview(list)
      if (list.length && subSelectedFacultyId === null) {
        const recommended = list.find((item) => !item.hasConflict) ?? list[0]
        setSubSelectedFacultyId(recommended.facultyId)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to preview'
      setSubStatus(message)
    } finally {
      setSubPreviewLoading(false)
    }
  }

  const saveEdit = async (form: {
    subjectCode?: string
    facultyid?: number
    typeOfLecture?: string
    room_number?: string | null
  }) => {
    if (!editingLecture) return
    setSavingEdit(true)
    setEditError(null)
    try {
      await updateSlot(editingLecture.id, form)
      setEditingLecture(null)
      loadTimetable()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lecture'
      setEditError(message)
    } finally {
      setSavingEdit(false)
    }
  }

  const approveSubstitution = async () => {
    if (!substitutionLecture || !substitutionSlot || !subDate) return
    if (!subSelectedFacultyId) {
      setSubStatus('Select a substitute faculty first.')
      return
    }

    const chosen = subPreview.find(
      (item) => item.facultyId === subSelectedFacultyId,
    )

    try {
      await createSubstitution({
        lectureId: substitutionLecture.id,
        slotId: substitutionSlot.id,
        date: subDate.toISOString().slice(0, 10),
        dayName: selectedDayName,
        temporaryOnly: true,
        autoApprove: true,
        substituteFacultyId: subSelectedFacultyId,
        substituteFacultyName: chosen?.facultyName,
        originalFacultyId: substitutionLecture.facultyid ?? undefined,
        originalFacultyName: substitutionLecture.faculty_name ?? undefined,
        subjectCode: substitutionLecture.subjectCode ?? undefined,
        subjectName: substitutionLecture.subject_name ?? undefined,
        lectureType: substitutionLecture.typeOfLecture ?? undefined,
        roomNumber: substitutionLecture.room_number ?? undefined,
        batch: substitutionLecture.batch ?? undefined,
        reason: subReason.trim() || undefined,
        notifyAssignedFaculty: true,
        approvedBy: user?.uid ?? undefined,
      })
      setSubStatus('Substitution approved for selected date.')
      setSubstitutionLecture(null)
      setSubstitutionSlot(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve substitution'
      setSubStatus(message)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Timetable</p>
          <h1 className="text-2xl font-semibold text-ink">
            {user?.user_type === UserRole.Faculty &&
            selectedBranch === null &&
            selectedSemester === null &&
            selectedDivision === null
              ? 'My Timetable'
              : 'Complete Timetable'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => navigate('/substitutions')}
              className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
              title="Substitutions"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          ) : null}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setDragMode((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                dragMode
                  ? 'border-warning/40 bg-warning/10 text-warning'
                  : 'border-border bg-white text-ink-muted'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Export CSV"
          >
            <FileDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => downloadTimetablePdf(weekly, {
              branchId: selectedBranch ?? undefined,
              semester: selectedSemester ?? undefined,
              division: selectedDivision ?? undefined,
            })}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Export PDF"
          >
            <FileDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={loadTimetable}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-ink">{selectedDayName}</div>
            <div className="text-sm text-ink-muted">
              {user?.user_type === UserRole.Faculty &&
              selectedBranch === null &&
              selectedSemester === null &&
              selectedDivision === null ? (
                'Your weekly teaching schedule'
              ) : (
                <>
                  {selectedBranch ? (branches as Record<number, string>)[selectedBranch] : 'All Branches'} ·{' '}
                  {selectedSemester ? `Sem ${selectedSemester}` : 'All Semesters'} ·{' '}
                  {selectedDivision ? `Div ${selectedDivision}` : 'All Divisions'}
                </>
              )}
            </div>
          </div>
          <div className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand">
            {visibleSlots.filter((slot) => slot.lectures.length > 0).length} slots
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((day, index) => {
          const isSelected = index === selectedDayIndex
          return (
            <button
              key={day}
              type="button"
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                isSelected
                  ? 'bg-brand text-white'
                  : 'border border-border bg-white text-ink-muted'
              }`}
              onClick={() => setSelectedDayIndex(index)}
            >
              {day.slice(0, 3)} · {occupiedCount(day)}
            </button>
          )
        })}
      </div>

      {dragMode ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          Drag mode is enabled. Use the lecture detail dialog to edit or create
          substitutions.
        </div>
      ) : null}

      <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-semibold text-ink-muted">
            Branch
            <select
              className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
              value={selectedBranch ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setSelectedBranch(value ? Number(value) : null)
                setTimeout(loadTimetable, 0)
              }}
            >
              <option value="">All Branches</option>
              {Object.entries(branches).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-muted">
            Semester
            <select
              className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
              value={selectedSemester ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setSelectedSemester(value ? Number(value) : null)
                setTimeout(loadTimetable, 0)
              }}
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-muted">
            Division
            <select
              className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
              value={selectedDivision ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setSelectedDivision(value || null)
                setTimeout(loadTimetable, 0)
              }}
            >
              <option value="">All Divisions</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  Div {division}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setSelectedBranch(null)
              setSelectedSemester(null)
              setSelectedDivision(null)
              loadTimetable()
            }}
            className="mt-auto rounded-xl border border-border px-3 py-2 text-xs font-semibold text-ink-muted"
          >
            Reset filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingScreen label="Loading timetable..." />
      ) : error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : !selectedDay ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No timetable data"
          subtitle="Load a weekly timetable for this selection."
        />
      ) : visibleSlots.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No lectures"
          subtitle="No lectures scheduled for this day."
        />
      ) : (
        <div className="grid gap-3">
          {visibleSlots.map((slot) => (
            <TimetableSlotCard
              key={slot.id}
              slot={slot}
              onClick={() => setSelectedSlot(slot)}
            />
          ))}
        </div>
      )}

      <LectureDetailModal
        slot={selectedSlot}
        isOpen={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        onEditLecture={
          isAdmin
            ? (lecture) => {
                setSelectedSlot(null)
                openEdit(lecture)
              }
            : undefined
        }
        onSubstituteLecture={
          isAdmin
            ? (lecture) => {
                if (selectedSlot) {
                  setSelectedSlot(null)
                  openSubstitution(lecture, selectedSlot)
                }
              }
            : undefined
        }
      />

      <EditLectureModal
        lecture={editingLecture}
        subjects={subjects}
        faculty={faculty}
        isSaving={savingEdit}
        error={editError}
        onClose={() => setEditingLecture(null)}
        onSave={saveEdit}
      />

      <SubstitutionModal
        lecture={substitutionLecture}
        slot={substitutionSlot}
        isOpen={Boolean(substitutionLecture && substitutionSlot)}
        dayName={selectedDayName}
        date={subDate}
        onClose={() => {
          setSubstitutionLecture(null)
          setSubstitutionSlot(null)
        }}
        onDateChange={(date) => {
          setSubDate(date)
          if (substitutionLecture && substitutionSlot) {
            runPreview(substitutionLecture, substitutionSlot, date)
          }
        }}
        reason={subReason}
        onReasonChange={setSubReason}
        preview={subPreview}
        previewLoading={subPreviewLoading}
        selectedFacultyId={subSelectedFacultyId}
        onSelectFaculty={setSubSelectedFacultyId}
        status={subStatus}
        onApprove={approveSubstitution}
      />
    </div>
  )
}

const EditLectureModal = ({
  lecture,
  subjects,
  faculty,
  onClose,
  onSave,
  isSaving,
  error,
}: {
  lecture: TimetableLecture | null
  subjects: Subject[]
  faculty: Faculty[]
  onClose: () => void
  onSave: (updates: {
    subjectCode?: string
    facultyid?: number
    typeOfLecture?: string
    room_number?: string | null
  }) => void
  isSaving: boolean
  error: string | null
}) => {
  const [subjectCode, setSubjectCode] = useState(lecture?.subjectCode ?? '')
  const [facultyId, setFacultyId] = useState<number | ''>(lecture?.facultyid ?? '')
  const [lectureType, setLectureType] = useState(lecture?.typeOfLecture ?? 'Lecture')
  const [roomNumber, setRoomNumber] = useState(lecture?.room_number ?? '')

  useEffect(() => {
    if (!lecture) return
    setSubjectCode(lecture.subjectCode ?? '')
    setFacultyId(lecture.facultyid ?? '')
    setLectureType(lecture.typeOfLecture ?? 'Lecture')
    setRoomNumber(lecture.room_number ?? '')
  }, [lecture])

  if (!lecture) return null

  return (
    <Modal
      isOpen={Boolean(lecture)}
      title="Edit Lecture"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            onClick={() =>
              onSave({
                subjectCode: subjectCode || undefined,
                facultyid: facultyId ? Number(facultyId) : undefined,
                typeOfLecture: lectureType || undefined,
                room_number: roomNumber.trim() || null,
              })
            }
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm text-ink">
          Subject
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={subjectCode}
            onChange={(event) => setSubjectCode(event.target.value)}
          >
            <option value="">Select subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.subject_code}>
                {subject.subject_name || subject.subject_code} ({subject.subject_code})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-ink">
          Faculty
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={facultyId}
            onChange={(event) =>
              setFacultyId(event.target.value ? Number(event.target.value) : '')
            }
          >
            <option value="">Select faculty</option>
            {faculty.map((member) => (
              <option key={member.faculty_id} value={member.faculty_id}>
                {member.name || `Faculty ${member.faculty_id}`}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-ink">
          Lecture Type
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={lectureType}
            onChange={(event) => setLectureType(event.target.value as 'Lecture' | 'Lab')}
          >
            {['Lecture', 'Lab', 'Tutorial'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-ink">
          Room Number
          <input
            className="rounded-xl border border-border px-3 py-2"
            value={roomNumber}
            onChange={(event) => setRoomNumber(event.target.value)}
            placeholder="e.g. 204"
          />
        </label>
        {error ? <div className="text-sm text-error">{error}</div> : null}
      </div>
    </Modal>
  )
}

const SubstitutionModal = ({
  lecture,
  slot,
  isOpen,
  dayName,
  date,
  onClose,
  onDateChange,
  reason,
  onReasonChange,
  preview,
  previewLoading,
  selectedFacultyId,
  onSelectFaculty,
  status,
  onApprove,
}: {
  lecture: TimetableLecture | null
  slot: TimetableSlot | null
  isOpen: boolean
  dayName: string
  date: Date | null
  onClose: () => void
  onDateChange: (date: Date) => void
  reason: string
  onReasonChange: (value: string) => void
  preview: any[]
  previewLoading: boolean
  selectedFacultyId: number | null
  onSelectFaculty: (id: number) => void
  status: string | null
  onApprove: () => void
}) => {
  if (!lecture || !slot || !date) return null

  return (
    <Modal
      isOpen={isOpen}
      title="Temporary Substitution"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            onClick={onApprove}
          >
            Approve
          </button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="text-sm font-semibold text-ink">
          {lecture.subject_name || lecture.subjectCode || 'Lecture'}
        </div>
        <div className="text-xs text-ink-muted">
          {dayName} · {formatSlotRange(slot)}
        </div>
        <label className="grid gap-1 text-sm text-ink">
          Apply Date
          <input
            type="date"
            className="rounded-xl border border-border px-3 py-2"
            value={formatDateInput(date)}
            onChange={(event) => onDateChange(new Date(`${event.target.value}T00:00:00`))}
          />
        </label>
        <label className="grid gap-1 text-sm text-ink">
          Reason (optional)
          <textarea
            className="rounded-xl border border-border px-3 py-2"
            rows={2}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </label>

        <div className="mt-2 text-sm font-semibold text-ink">What-if Preview</div>
        {previewLoading ? (
          <div className="text-sm text-ink-muted">Loading preview...</div>
        ) : preview.length ? (
          <div className="grid gap-2">
            {preview.map((candidate) => (
              <label
                key={candidate.facultyId}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                  selectedFacultyId === candidate.facultyId
                    ? 'border-brand bg-brand/10'
                    : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="faculty"
                  checked={selectedFacultyId === candidate.facultyId}
                  onChange={() => onSelectFaculty(candidate.facultyId)}
                />
                <div className="flex-1">
                  <div className="font-semibold text-ink">{candidate.facultyName}</div>
                  <div className="text-xs text-ink-muted">
                    {candidate.summary || `Score ${candidate.score}`}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    candidate.hasConflict ? 'text-warning' : 'text-success'
                  }`}
                >
                  {candidate.hasConflict ? 'Conflict' : 'Recommended'}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-sm text-ink-muted">No preview candidates found.</div>
        )}

        {status ? (
          <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink-muted">
            {status}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
