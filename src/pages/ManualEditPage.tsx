import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock,
  Edit2,
  Info,
  Layers,
  MapPin,
  RefreshCcw,
  SlidersHorizontal,
  User,
} from 'lucide-react'
import { getWeekly, updateSlot, moveSlot } from '../api/timetable'
import { getAll as getSubjects } from '../api/subjects'
import { getAll as getFaculty } from '../api/faculty'
import { academicYearOptions, currentAcademicYear } from '../utils/academicYear'
import { branchMap } from '../utils/branch'
import { Modal } from '../components/Modal'
import type { TimetableDay, TimetableLecture, TimetableSlot } from '../types/timetable'

interface SubjectOption {
  subject_code: string
  subject_name: string | null
}

interface FacultyOption {
  faculty_id: number
  name: string | null
}

export const ManualEditPage = () => {
  const [weekly, setWeekly] = useState<TimetableDay[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [faculty, setFaculty] = useState<FacultyOption[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selector states
  const [academicYear, setAcademicYear] = useState(currentAcademicYear())
  const [branchId, setBranchId] = useState<number | null>(null)
  const [semester, setSemester] = useState<number | null>(null)
  const [division, setDivision] = useState<string | null>(null)

  // Edit Modal State
  const [editLecture, setEditLecture] = useState<TimetableLecture | null>(null)
  const [editSubjectCode, setEditSubjectCode] = useState('')
  const [editFacultyId, setEditFacultyId] = useState<number | null>(null)
  const [editLectureType, setEditLectureType] = useState<'Lecture' | 'Lab'>('Lecture')
  const [editRoomNumber, setEditRoomNumber] = useState('')
  const [editBatch, setEditBatch] = useState<string>('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Switch Modal State
  const [switchLecture, setSwitchLecture] = useState<TimetableLecture | null>(null)
  const [switchCurrentDay, setSwitchCurrentDay] = useState('')
  const [switchCurrentSlot, setSwitchCurrentSlot] = useState<TimetableSlot | null>(null)
  const [switchTargetDayName, setSwitchTargetDayName] = useState('')
  const [switchTargetSlotId, setSwitchTargetSlotId] = useState<number | null>(null)
  const [isSavingSwitch, setIsSavingSwitch] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)

  const loadMetaData = () => {
    Promise.all([getSubjects(), getFaculty()])
      .then(([subjectsData, facultyData]) => {
        setSubjects(subjectsData as SubjectOption[])
        setFaculty(facultyData as FacultyOption[])
      })
      .catch((err) => {
        console.error('Failed to load metadata:', err)
      })
  }

  useEffect(() => {
    loadMetaData()
  }, [])

  const loadTimetable = () => {
    if (branchId !== null && semester !== null && division !== null) {
      setLoading(true)
      setError(null)
      getWeekly({
        branchId,
        sem: String(semester),
        division,
        academicYear,
      })
        .then((data) => {
          setWeekly(data)
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Failed to fetch timetable'
          setError(message)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  useEffect(() => {
    loadTimetable()
  }, [academicYear, branchId, semester, division])

  // Edit details handlers
  const handleOpenEdit = (lec: TimetableLecture) => {
    setEditLecture(lec)
    setEditSubjectCode(lec.subjectCode || '')
    setEditFacultyId(lec.facultyid || null)
    setEditLectureType(lec.typeOfLecture === 'Lab' ? 'Lab' : 'Lecture')
    setEditRoomNumber(lec.room_number || '')
    setEditBatch(lec.batch || '')
    setEditError(null)
  }

  const handleSaveEdit = async () => {
    if (!editLecture) return
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await updateSlot(editLecture.id, {
        subjectCode: editSubjectCode || null,
        facultyid: editFacultyId,
        typeOfLecture: editLectureType,
        room_number: editRoomNumber.trim() || null,
        batch: editBatch || null,
      })
      setEditLecture(null)
      loadTimetable()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update lecture'
      setEditError(msg)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Switch/relocate handlers
  const handleOpenSwitch = (lec: TimetableLecture, dayName: string, slot: TimetableSlot) => {
    setSwitchLecture(lec)
    setSwitchCurrentDay(dayName)
    setSwitchCurrentSlot(slot)
    setSwitchTargetDayName(dayName)
    setSwitchTargetSlotId(slot.id)
    setSwitchError(null)
  }

  const handleDayChanged = (newDayName: string) => {
    if (newDayName === switchTargetDayName) return

    const newDayData = weekly.find((d) => d.dateOfWeek?.toLowerCase() === newDayName.toLowerCase())
    const oldDayData = weekly.find((d) => d.dateOfWeek?.toLowerCase() === switchTargetDayName.toLowerCase())

    if (!newDayData || !oldDayData) return

    const currentSlotIndex = oldDayData.slots.findIndex((s) => s.id === switchTargetSlotId)

    setSwitchTargetDayName(newDayName)
    if (currentSlotIndex !== -1 && currentSlotIndex < newDayData.slots.length) {
      setSwitchTargetSlotId(newDayData.slots[currentSlotIndex].id)
    } else if (newDayData.slots.length > 0) {
      setSwitchTargetSlotId(newDayData.slots[0].id)
    }
  }

  const handleSaveSwitch = async () => {
    if (!switchLecture || !switchTargetSlotId || switchTargetSlotId === switchCurrentSlot?.id) {
      setSwitchLecture(null)
      return
    }

    setIsSavingSwitch(true)
    setSwitchError(null)

    try {
      await moveSlot(switchLecture.id, {
        targetSlotId: switchTargetSlotId,
        swap: true,
      })
      setSwitchLecture(null)
      loadTimetable()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to relocate slot'
      setSwitchError(msg)
    } finally {
      setIsSavingSwitch(false)
    }
  }

  const isFilterSelected = branchId !== null && semester !== null && division !== null

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-[calc(100vh-80px)]">
      {/* Filters Sidebar */}
      <div className="w-full lg:w-80 bg-white border border-border rounded-3xl p-5 shadow-soft shrink-0 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand/10 p-2.5 rounded-2xl">
            <SlidersHorizontal className="h-5 w-5 text-brand" />
          </div>
          <h2 className="text-lg font-bold text-ink">Class Filters</h2>
        </div>

        <div className="grid gap-3 mt-2">
          <label className="flex flex-col gap-1 text-xs font-bold text-ink-muted">
            Academic Year
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              {academicYearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-bold text-ink-muted">
            Department / Branch
            <select
              value={branchId ?? ''}
              onChange={(e) => setBranchId(Number(e.target.value) || null)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="">Select Branch</option>
              {Object.entries(branchMap).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-bold text-ink-muted">
            Semester
            <select
              value={semester ?? ''}
              onChange={(e) => setSemester(Number(e.target.value) || null)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="">Select Semester</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                <option key={sem} value={sem}>
                  Sem {sem}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-bold text-ink-muted">
            Division
            <select
              value={division ?? ''}
              onChange={(e) => setDivision(e.target.value || null)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="">Select Division</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
            </select>
          </label>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <div className="rounded-2xl bg-[#F8FAFC] border border-border p-4 flex gap-3 text-ink-muted text-xs leading-relaxed mt-5">
            <Info className="h-5 w-5 text-brand shrink-0" />
            <div>
              Click <span className="font-bold text-brand">Switch</span> on any lecture to relocate it or swap it with another slot across weekdays.
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1">
        {loading && !isFilterSelected ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : !isFilterSelected ? (
          <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white border border-border rounded-3xl shadow-soft">
            <CalendarDays className="h-16 w-16 text-gray-300" />
            <p className="text-ink-muted font-medium">Select a Branch, Semester and Division to load the weekly editor</p>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Weekly Editor</p>
                <h1 className="text-xl font-bold text-ink">
                  {branchMap[branchId!]} · Sem {semester} · Div {division}
                </h1>
              </div>
              <button
                type="button"
                onClick={loadTimetable}
                className="rounded-xl border border-border bg-white px-3 py-2 hover:bg-[#F8FAFC] active:scale-95 transition"
              >
                <RefreshCcw className="h-4 w-4 text-ink-muted" />
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            ) : null}

            {weekly.map((dayData) => (
              <div key={dayData.id} className="rounded-3xl border border-border bg-white overflow-hidden shadow-soft">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-brand to-[#79A1FF] px-6 py-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2 font-bold text-md">
                    <CalendarDays className="h-4 w-4 text-white/80" />
                    <span>{dayData.dateOfWeek}</span>
                  </div>
                  <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                    {dayData.slots.filter((s) => s.lectures.length > 0).length} Slots Filled
                  </span>
                </div>

                {/* Period Slots */}
                <div className="divide-y divide-border">
                  {dayData.slots.map((slot) => {
                    const hasLectures = slot.lectures.length > 0
                    const formattedStartTime = `${String(slot.startTimeHr).padStart(2, '0')}:${String(slot.startTimeMinutes).padStart(2, '0')}`
                    const formattedEndTime = `${String(slot.endTimeHr).padStart(2, '0')}:${String(slot.endTimeMinutes).padStart(2, '0')}`

                    return (
                      <div
                        key={slot.id}
                        className={`flex flex-col md:flex-row p-5 gap-4 items-start ${
                          hasLectures ? 'bg-white' : 'bg-[#FDFDFD]'
                        }`}
                      >
                        {/* Time */}
                        <div className="w-32 flex flex-row md:flex-col items-center md:items-start gap-1 shrink-0 text-ink">
                          <Clock className="h-4 w-4 text-brand/60 md:hidden" />
                          <span className="font-bold text-md">{formattedStartTime}</span>
                          <span className="text-xs text-ink-muted md:block hidden">to {formattedEndTime}</span>
                        </div>

                        {/* Contents */}
                        <div className="flex-1 w-full">
                          {hasLectures ? (
                            <div className="grid gap-3">
                              {slot.lectures.map((lec) => {
                                const isLab = lec.typeOfLecture === 'Lab'
                                return (
                                  <div
                                    key={lec.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between border border-border/60 bg-surface rounded-2xl p-4 gap-3 transition hover:shadow-sm"
                                  >
                                    <div className="grid gap-1.5">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-md text-ink">
                                          {lec.subject_name || lec.subjectCode || 'No Subject'}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            isLab
                                              ? 'bg-purple-100 text-purple-800'
                                              : 'bg-blue-100 text-blue-800'
                                          }`}
                                        >
                                          {lec.typeOfLecture ?? 'Lecture'}
                                        </span>
                                        {lec.batch ? (
                                          <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                            Batch {lec.batch}
                                          </span>
                                        ) : null}
                                      </div>
                                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                                        <span className="flex items-center gap-1">
                                          <User className="h-3.5 w-3.5" />
                                          {lec.faculty_name || 'Unassigned'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5" />
                                          {lec.room_number ? `Room ${lec.room_number}` : 'No Room'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(lec)}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-brand/40 text-brand rounded-xl hover:bg-brand/5 active:scale-95 transition"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenSwitch(lec, dayData.dateOfWeek ?? '', slot)}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-purple-400 text-purple-700 rounded-xl hover:bg-purple-50 active:scale-95 transition"
                                      >
                                        <Layers className="h-3.5 w-3.5" />
                                        Switch
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-ink-muted text-sm font-medium py-1 italic">
                              <span className="h-1.5 w-1.5 bg-gray-300 rounded-full" />
                              Recess / Free Period
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      <Modal
        isOpen={Boolean(editLecture)}
        title="Edit Lecture Details"
        onClose={() => setEditLecture(null)}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm bg-white hover:bg-gray-50 transition outline-none"
              onClick={() => setEditLecture(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSavingEdit}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition outline-none disabled:opacity-55"
              onClick={handleSaveEdit}
            >
              Save Details
            </button>
          </div>
        }
      >
        <div className="grid gap-4 py-1">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
            Subject
            <select
              value={editSubjectCode}
              onChange={(e) => setEditSubjectCode(e.target.value)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub.subject_code} value={sub.subject_code}>
                  {sub.subject_name || sub.subject_code} ({sub.subject_code})
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
            Faculty
            <select
              value={editFacultyId ?? ''}
              onChange={(e) => setEditFacultyId(Number(e.target.value) || null)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="">Select Faculty</option>
              {faculty.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.name || `Faculty ${f.faculty_id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
            Lecture Type
            <select
              value={editLectureType}
              onChange={(e) => setEditLectureType(e.target.value as 'Lecture' | 'Lab')}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="Lecture">Lecture</option>
              <option value="Lab">Lab</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
            Batch (Optional)
            <select
              value={editBatch}
              onChange={(e) => setEditBatch(e.target.value)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
            >
              <option value="">Whole Division</option>
              <option value="A">Batch A</option>
              <option value="B">Batch B</option>
              <option value="C">Batch C</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
            Room Number
            <input
              type="text"
              placeholder="e.g. 204"
              value={editRoomNumber}
              onChange={(e) => setEditRoomNumber(e.target.value)}
              className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand"
            />
          </label>

          {editError ? (
            <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-xs text-error mt-2">
              {editError}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Switch Slot Modal */}
      <Modal
        isOpen={Boolean(switchLecture)}
        title="Switch / Move Lecture"
        onClose={() => setSwitchLecture(null)}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm bg-white hover:bg-gray-50 transition outline-none"
              onClick={() => setSwitchLecture(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSavingSwitch}
              className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 transition outline-none disabled:opacity-55"
              onClick={handleSaveSwitch}
            >
              Move / Switch
            </button>
          </div>
        }
      >
        {switchLecture ? (
          <div className="grid gap-4 py-1">
            <div className="text-sm">
              <span className="font-bold text-ink">Move Lecture:</span> {switchLecture.subject_name || switchLecture.subjectCode}
              <p className="text-xs text-ink-muted mt-1">
                Current: <span className="font-semibold">{switchCurrentDay}</span> at{' '}
                <span className="font-semibold">
                  {`${String(switchCurrentSlot?.startTimeHr).padStart(2, '0')}:${String(
                    switchCurrentSlot?.startTimeMinutes,
                  ).padStart(2, '0')}`}
                </span>
              </p>
            </div>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
              Target Day
              <select
                value={switchTargetDayName}
                onChange={(e) => handleDayChanged(e.target.value)}
                className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-bold text-ink-muted">
              Target Period / Time Slot
              <select
                value={switchTargetSlotId ?? ''}
                onChange={(e) => setSwitchTargetSlotId(Number(e.target.value) || null)}
                className="mt-1 rounded-xl border border-border px-3 py-2 text-sm text-ink outline-none hover:border-brand/40 focus:border-brand bg-white"
              >
                {weekly
                  .find((d) => d.dateOfWeek?.toLowerCase() === switchTargetDayName.toLowerCase())
                  ?.slots.map((s) => {
                    const labelTime = `${String(s.startTimeHr).padStart(2, '0')}:${String(s.startTimeMinutes).padStart(2, '0')}`
                    const occupier = s.lectures.length > 0 ? ` (${s.lectures[0].subjectCode})` : ' (Free slot)'
                    return (
                      <option key={s.id} value={s.id}>
                        {labelTime} - {occupier}
                      </option>
                    )
                  })}
              </select>
            </label>

            {switchError ? (
              <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-xs text-error mt-2">
                {switchError}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
