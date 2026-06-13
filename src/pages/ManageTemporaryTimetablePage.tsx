import { useEffect, useState } from 'react'
import { CalendarRange, Download, Plus, RefreshCcw, Trash2, Calendar, FileText, MapPin, User, AlertCircle } from 'lucide-react'
import { list, remove, createBulk, downloadTemporaryPdf } from '../api/temporary'
import { getAll as getTimeslots } from '../api/timeslots'
import { getAll as getFaculty } from '../api/faculty'
import { getAll as getSubjects } from '../api/subjects'
import { getAll as getRooms } from '../api/rooms'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Faculty } from '../types/faculty'
import type { Subject } from '../types/subject'
import type { Room } from '../types/room'
import type { TimeSlotTemplate } from '../types/timeslot'
import type { TemporaryTimeSlot } from '../types/temporary'
import { branchMap } from '../utils/branch'
import { formatDateShort, formatDayName } from '../utils/date'
import { formatTime } from '../utils/timetable'

export const ManageTemporaryTimetablePage = () => {
  const [slots, setSlots] = useState<TemporaryTimeSlot[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [rooms, setRooms] = useState<Room[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TemporaryTimeSlot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filters state
  const [branchFilter, setBranchFilter] = useState<number>(1)
  const [semesterFilter, setSemesterFilter] = useState<number>(4)
  const [divisionFilter, setDivisionFilter] = useState<string>('A')

  // Date range filters (default to today to today + 7 days)
  const [fromDateFilter, setFromDateFilter] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [toDateFilter, setToDateFilter] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })

  const loadSlots = () => {
    setLoading(true)
    setError(null)
    list({
      branchId: branchFilter,
      sem: semesterFilter,
      division: divisionFilter,
      fromDate: fromDateFilter,
      toDate: toDateFilter,
    })
      .then((data) => setSlots(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load temporary slots'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  const loadDependencies = () => {
    Promise.all([getFaculty(), getSubjects(), getRooms()])
      .then(([facultyData, subjectData, roomData]) => {
        setFaculty(facultyData)
        setSubjects(subjectData)
        setRooms(roomData)
      })
      .catch((err) => {
        console.error('Error loading configuration dependencies', err)
      })
  }

  useEffect(() => {
    loadSlots()
  }, [branchFilter, semesterFilter, divisionFilter, fromDateFilter, toDateFilter])

  useEffect(() => {
    loadDependencies()
  }, [])

  const handleDelete = async (slot: TemporaryTimeSlot) => {
    try {
      await remove(slot.id)
      setConfirmDelete(null)
      loadSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleExportPdf = async () => {
    try {
      setError(null)
      await downloadTemporaryPdf({
        branchId: branchFilter,
        sem: semesterFilter,
        division: divisionFilter,
        fromDate: fromDateFilter,
        toDate: toDateFilter,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF Generation failed')
    }
  }

  const handleSaveBulk = async (payload: any) => {
    setSaving(true)
    try {
      await createBulk(payload)
      setIsModalOpen(false)
      loadSlots()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
          <h1 className="text-2xl font-semibold text-ink">Temporary Timetable</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={slots.length === 0}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted disabled:opacity-50"
            title="Export PDF Report"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={loadSlots}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="mr-2 h-4 w-4 inline-block" />
            Schedule Event
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="grid flex-1 min-w-[120px] gap-1 text-xs font-semibold text-ink-muted">
              Branch
              <select
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none"
                value={branchFilter}
                onChange={(e) => setBranchFilter(Number(e.target.value))}
              >
                {Object.entries(branchMap).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid flex-1 min-w-[120px] gap-1 text-xs font-semibold text-ink-muted">
              Semester
              <select
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(Number(e.target.value))}
              >
                {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                  <option key={sem} value={sem}>
                    Sem {sem}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid flex-1 min-w-[120px] gap-1 text-xs font-semibold text-ink-muted">
              Division
              <select
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink bg-white outline-none"
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
              >
                {['A', 'B', 'C'].map((div) => (
                  <option key={div} value={div}>
                    Div {div}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <label className="grid flex-1 min-w-[140px] gap-1 text-xs font-semibold text-ink-muted">
              From Date
              <input
                type="date"
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
              />
            </label>
            <label className="grid flex-1 min-w-[140px] gap-1 text-xs font-semibold text-ink-muted">
              To Date
              <input
                type="date"
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-ink-muted">Loading temporary slots...</div>
      ) : slots.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="h-6 w-6" />}
          title="No temporary slots found"
          subtitle="Try modifying your filters or click 'Schedule Event' to set a new temporary timetable."
        />
      ) : (
        <div className="grid gap-3">
          {slots.map((slot) => {
            const dateObj = new Date(slot.date)
            return (
              <div
                key={slot.id}
                className="flex items-start justify-between rounded-2xl border border-border bg-white px-5 py-4 shadow-sm hover:shadow-md transition gap-3"
              >
                <div className="grid gap-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {slot.subject_name || slot.subjectCode || 'Special Event'}
                    </span>
                    <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                      {slot.typeOfLecture || 'Lecture'}
                    </span>
                    {slot.eventName ? (
                      <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                        {slot.eventName}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      {formatDayName(dateObj)}, {formatDateShort(dateObj)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-brand" />
                      {formatTime(slot.startTimeHr, slot.startTimeMinutes)} -{' '}
                      {formatTime(slot.endTimeHr, slot.endTimeMinutes)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-brand" />
                      Teacher: {slot.faculty_name || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-brand" />
                      Room: {slot.room_number || 'No Room'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-error/30 bg-error/10 p-2 text-xs font-semibold text-error mt-0.5"
                  onClick={() => setConfirmDelete(slot)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmDelete)}
        title="Delete Temporary Slot"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm bg-white"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Delete temporary slot for{' '}
          <strong>
            {confirmDelete?.subject_name || confirmDelete?.subjectCode || 'Event'}
          </strong>{' '}
          on{' '}
          <strong>
            {confirmDelete ? formatDateShort(new Date(confirmDelete.date)) : ''}
          </strong>
          ? This cannot be undone.
        </p>
      </Modal>

      {/* Bulk Scheduling Form Modal */}
      <ScheduleEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBulk}
        branchId={branchFilter}
        sem={semesterFilter}
        division={divisionFilter}
        subjects={subjects.filter((s) => s.semester === semesterFilter && s.branch_id === branchFilter)}
        rooms={rooms.filter((r) => r.is_active !== 0)}
        faculty={faculty}
        isSaving={isSaving}
      />
    </div>
  )
}

const ScheduleEventModal = ({
  isOpen,
  onClose,
  onSave,
  branchId,
  sem,
  division,
  subjects,
  rooms,
  faculty,
  isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: any) => void
  branchId: number
  sem: number
  division: string
  subjects: Subject[]
  rooms: Room[]
  faculty: Faculty[]
  isSaving: boolean
}) => {
  const [eventName, setEventName] = useState('')
  const [isRangeMode, setRangeMode] = useState(false)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [toDate, setToDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })

  // Timeslots checklist loading
  const [timeslots, setTimeslots] = useState<TimeSlotTemplate[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Checklist slot selection states
  const [selectedSlots, setSelectedSlots] = useState<Record<number, boolean>>({})
  const [slotSubjects, setSlotSubjects] = useState<Record<number, string>>({})
  const [slotRooms, setSlotRooms] = useState<Record<number, string>>({})

  // Load active timeslots for this branch
  useEffect(() => {
    if (!isOpen) return
    setSlotsLoading(true)
    getTimeslots({ branchId })
      .then((data) => {
        const active = data
          .filter((t) => t.is_active !== 0 && t.is_break !== 1)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        setTimeslots(active)

        // Reset inputs
        setSelectedSlots({})
        setSlotSubjects({})
        setSlotRooms({})
      })
      .catch((err) => console.error('Timeslots load failed', err))
      .finally(() => setSlotsLoading(false))
  }, [isOpen, branchId])

  if (!isOpen) return null

  const facultyMap = new Map(faculty.map((f) => [f.faculty_id, f.name]))

  const handleToggleSlot = (slotId: number) => {
    setSelectedSlots((prev) => ({ ...prev, [slotId]: !prev[slotId] }))
  }

  const handleSubjectChange = (slotId: number, code: string) => {
    setSlotSubjects((prev) => ({ ...prev, [slotId]: code }))
  }

  const handleRoomChange = (slotId: number, num: string) => {
    setSlotRooms((prev) => ({ ...prev, [slotId]: num }))
  }

  const handleSubmit = () => {
    if (!eventName.trim()) {
      alert('Occasion/Purpose is required')
      return
    }

    const payloadSlots = []
    for (const slot of timeslots) {
      if (selectedSlots[slot.id]) {
        const subCode = slotSubjects[slot.id]
        if (!subCode) {
          alert(`Please select a subject for slot ${slot.label || formatTime(slot.startTimeHr, slot.startTimeMinutes)}`)
          return
        }

        const subject = subjects.find((s) => s.subject_code === subCode)
        const facultyId = subject
          ? Number(subject.professorAssign ?? subject.professor_assign ?? 0) || null
          : null

        payloadSlots.push({
          startTimeHr: slot.startTimeHr,
          startTimeMinutes: slot.startTimeMinutes,
          endTimeHr: slot.endTimeHr,
          endTimeMinutes: slot.endTimeMinutes,
          subjectCode: subCode,
          facultyId,
          roomNumber: slotRooms[slot.id] || null,
        })
      }
    }

    if (payloadSlots.length === 0) {
      alert('Please select at least one timeslot')
      return
    }

    const payload: any = {
      branchId,
      sem,
      division,
      eventName: eventName.trim(),
      slots: payloadSlots,
    }

    if (isRangeMode) {
      payload.fromDate = fromDate
      payload.toDate = toDate
    } else {
      payload.date = date
    }

    onSave(payload)
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Generate Temporary Timetable"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2 text-sm bg-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? 'Scheduling...' : 'Schedule Event'}
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm text-ink font-semibold">
          Occasion / Purpose *
          <input
            type="text"
            className="rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none mt-1"
            placeholder="e.g. Sports Day, Exam Week, Guest Lectures"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-ink my-1">
          <input
            type="checkbox"
            checked={isRangeMode}
            onChange={(e) => setRangeMode(e.target.checked)}
          />
          Multiple Days (Apply to date range)
        </label>

        {isRangeMode ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs text-ink-muted">
              Start Date
              <input
                type="date"
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none mt-1"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs text-ink-muted">
              End Date
              <input
                type="date"
                className="rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none mt-1"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </label>
          </div>
        ) : (
          <label className="grid gap-1 text-xs text-ink-muted">
            Date
            <input
              type="date"
              className="rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none mt-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        )}

        <div className="border-t border-border pt-3">
          <div className="text-sm font-semibold text-ink mb-1">Select Timeslots & Assign Subjects</div>
          <p className="text-xs text-ink-muted mb-3">
            Check the periods you want to include, then assign a subject and optional room for each.
          </p>

          {slotsLoading ? (
            <div className="text-xs text-ink-muted text-center py-4">Loading active timeslots...</div>
          ) : timeslots.length === 0 ? (
            <div className="text-xs text-error py-2">
              No active timeslot templates found. Configure them in Admin → Time Slots first.
            </div>
          ) : (
            <div className="grid gap-3">
              {timeslots.map((slot) => {
                const isChecked = selectedSlots[slot.id] ?? false
                const currentSubCode = slotSubjects[slot.id] || ''

                // Get teacher name
                let teacherName = ''
                if (currentSubCode) {
                  const sub = subjects.find((s) => s.subject_code === currentSubCode)
                  const profId = sub ? Number(sub.professorAssign ?? sub.professor_assign ?? 0) : 0
                  if (profId) teacherName = facultyMap.get(profId) || ''
                }

                return (
                  <div
                    key={slot.id}
                    className={`rounded-2xl border p-3 grid gap-3 transition-colors ${
                      isChecked ? 'border-brand bg-brand-light/5' : 'border-border bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSlot(slot.id)}
                        className="rounded h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-ink">
                          {slot.label || 'Slot'}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {formatTime(slot.startTimeHr, slot.startTimeMinutes)} -{' '}
                          {formatTime(slot.endTimeHr, slot.endTimeMinutes)}
                        </div>
                      </div>
                    </div>

                    {isChecked ? (
                      <div className="grid gap-2 pl-7 border-t border-dashed border-border pt-2">
                        <label className="grid gap-1 text-[11px] text-ink-muted">
                          Subject *
                          <select
                            className="rounded-lg border border-border px-2 py-1.5 text-xs text-ink bg-white outline-none"
                            value={currentSubCode}
                            onChange={(e) => handleSubjectChange(slot.id, e.target.value)}
                          >
                            <option value="">Select subject</option>
                            {subjects.map((sub) => (
                              <option key={sub.id} value={sub.subject_code}>
                                {sub.subject_code} - {sub.subject_name}
                              </option>
                            ))}
                          </select>
                        </label>

                        {teacherName ? (
                          <div className="rounded bg-green-50 px-2 py-1 text-[10px] text-green-700 font-semibold border border-green-100 flex items-center gap-1.5 self-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                            Teacher: {teacherName}
                          </div>
                        ) : null}

                        <label className="grid gap-1 text-[11px] text-ink-muted">
                          Room (optional)
                          <select
                            className="rounded-lg border border-border px-2 py-1.5 text-xs text-ink bg-white outline-none"
                            value={slotRooms[slot.id] || ''}
                            onChange={(e) => handleRoomChange(slot.id, e.target.value)}
                          >
                            <option value="">-- No Room --</option>
                            {rooms.map((r) => (
                              <option key={r.id} value={r.room_number}>
                                {r.room_number} - {r.name || r.room_type}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
