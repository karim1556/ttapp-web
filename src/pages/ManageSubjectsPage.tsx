import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { createSubject, getAll as getSubjects, removeSubject, updateSubject } from '../api/subjects'
import { getAll as getFaculty } from '../api/faculty'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Faculty } from '../types/faculty'
import type { Subject } from '../types/subject'
import { academicYearOptions, currentAcademicYear } from '../utils/academicYear'
import { branchMap } from '../utils/branch'

export const ManageSubjectsPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Subject | null>(null)

  const loadSubjects = () => {
    setLoading(true)
    setError(null)
    Promise.all([getSubjects(), getFaculty()])
      .then(([subjectData, facultyData]) => {
        setSubjects(subjectData)
        setFaculty(facultyData)
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load subjects'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subjects.filter((subject) => {
      const matchesQuery =
        !q ||
        subject.subject_name?.toLowerCase().includes(q) ||
        subject.subject_code.toLowerCase().includes(q)
      const matchesSemester =
        semesterFilter === null || subject.semester === semesterFilter
      return matchesQuery && matchesSemester
    })
  }, [subjects, search, semesterFilter])

  const handleSave = async (payload: Partial<Subject>, existing?: Subject | null) => {
    if (existing) {
      await updateSubject(existing.id, payload)
    } else {
      await createSubject(payload)
    }
    loadSubjects()
  }

  const handleDelete = async (subject: Subject) => {
    await removeSubject(subject.id)
    loadSubjects()
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
          <h1 className="text-2xl font-semibold text-ink">Manage Subjects</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSubjects}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setEditing({
                id: 0,
                subject_code: '',
              } as Subject)
            }
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
              <Search className="h-4 w-4" />
            </div>
            <input
              className="flex-1 border-0 bg-transparent text-sm text-ink outline-none"
              placeholder="Search by name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
            value={semesterFilter ?? ''}
            onChange={(event) =>
              setSemesterFilter(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">All semesters</option>
            {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => (
              <option key={sem} value={sem}>
                Sem {sem}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-ink-muted">Loading subjects...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No subjects found"
          subtitle={search ? 'Try a different search term.' : 'Add your first subject.'}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((subject) => (
            <div
              key={subject.id}
              className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {subject.subject_name || subject.subject_code}
                  </div>
                  <div className="text-xs text-ink-muted">{subject.subject_code}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
                    {subject.semester ? <span>Sem {subject.semester}</span> : null}
                    {subject.branch_id ? (
                      <span>{branchMap[subject.branch_id] ?? subject.branch_id}</span>
                    ) : null}
                    {subject.weekly_hours || subject.weeklyHours ? (
                      <span>
                        {subject.weekly_hours ?? subject.weeklyHours} hrs/week
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setEditing(subject)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-error/30 bg-error/10 px-3 py-1 text-xs font-semibold text-error"
                    onClick={() => setConfirmDelete(subject)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubjectFormModal
        subject={editing}
        faculty={faculty}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          handleSave(payload, editing?.id ? editing : null).finally(() => setEditing(null))
        }}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        title="Delete Subject"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                if (confirmDelete) {
                  handleDelete(confirmDelete).finally(() => setConfirmDelete(null))
                }
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink">
          Delete {confirmDelete?.subject_name || 'this subject'}? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

const SubjectFormModal = ({
  subject,
  faculty,
  isOpen,
  onClose,
  onSave,
}: {
  subject: Subject | null
  faculty: Faculty[]
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<Subject>) => void
}) => {
  const [subjectName, setSubjectName] = useState(subject?.subject_name ?? '')
  const [subjectCode, setSubjectCode] = useState(subject?.subject_code ?? '')
  const [semester, setSemester] = useState<number>(subject?.semester ?? 1)
  const [branchId, setBranchId] = useState<number>(subject?.branch_id ?? 1)
  const [acadYear, setAcadYear] = useState(subject?.acad_year ?? currentAcademicYear())
  const [weeklyHours, setWeeklyHours] = useState(
    (subject?.weekly_hours ?? subject?.weeklyHours ?? '').toString(),
  )
  const [semesterHours, setSemesterHours] = useState(
    (subject?.semester_hours ?? subject?.semesterHours ?? '').toString(),
  )
  const [professorAssign, setProfessorAssign] = useState(
    subject?.professor_assign ?? subject?.professorAssign ?? '',
  )
  const [isPractical, setIsPractical] = useState(
    (subject?.isPractical ?? Number(subject?.ispractical) ?? 0) === 1,
  )
  const [isOral, setIsOral] = useState(
    (subject?.isOral ?? Number(subject?.isoral) ?? 0) === 1,
  )
  const [maxMarks, setMaxMarks] = useState((subject?.max_marks ?? '').toString())
  const [passingMarks, setPassingMarks] = useState(
    (subject?.passing_marks ?? '').toString(),
  )
  const [oralMarks, setOralMarks] = useState((subject?.oral_marks ?? '').toString())
  const [practicalMarks, setPracticalMarks] = useState(
    (subject?.practical_marks ?? '').toString(),
  )
  const [numModules, setNumModules] = useState(
    (subject?.num_modules ?? '').toString(),
  )
  const [numExperiments, setNumExperiments] = useState(
    (subject?.num_experiments ?? '').toString(),
  )
  const [numAssignments, setNumAssignments] = useState(
    (subject?.num_assignments ?? '').toString(),
  )
  const [experiments, setExperiments] = useState(subject?.experiments ?? '')
  const [theory, setTheory] = useState(subject?.theory ?? '')

  useEffect(() => {
    if (!subject) return
    setSubjectName(subject.subject_name ?? '')
    setSubjectCode(subject.subject_code ?? '')
    setSemester(subject.semester ?? 1)
    setBranchId(subject.branch_id ?? 1)
    setAcadYear(subject.acad_year ?? currentAcademicYear())
    setWeeklyHours((subject.weekly_hours ?? subject.weeklyHours ?? '').toString())
    setSemesterHours((subject.semester_hours ?? subject.semesterHours ?? '').toString())
    setProfessorAssign(subject.professor_assign ?? subject.professorAssign ?? '')
    setIsPractical((subject.isPractical ?? Number(subject.ispractical) ?? 0) === 1)
    setIsOral((subject.isOral ?? Number(subject.isoral) ?? 0) === 1)
    setMaxMarks((subject.max_marks ?? '').toString())
    setPassingMarks((subject.passing_marks ?? '').toString())
    setOralMarks((subject.oral_marks ?? '').toString())
    setPracticalMarks((subject.practical_marks ?? '').toString())
    setNumModules((subject.num_modules ?? '').toString())
    setNumExperiments((subject.num_experiments ?? '').toString())
    setNumAssignments((subject.num_assignments ?? '').toString())
    setExperiments(subject.experiments ?? '')
    setTheory(subject.theory ?? '')
  }, [subject])

  if (!subject) return null

  const toNumber = (value: string) => (value.trim() ? Number(value) : undefined)

  const handleSubmit = () => {
    if (!subjectName.trim() || !subjectCode.trim()) return
    onSave({
      subject_name: subjectName.trim(),
      subject_code: subjectCode.trim(),
      semester,
      branch_id: branchId,
      acad_year: acadYear,
      weekly_hours: toNumber(weeklyHours),
      semester_hours: toNumber(semesterHours),
      professor_assign: professorAssign || undefined,
      ispractical: isPractical ? 1 : 0,
      isoral: isOral ? 1 : 0,
      max_marks: toNumber(maxMarks),
      passing_marks: toNumber(passingMarks),
      oral_marks: toNumber(oralMarks),
      practical_marks: toNumber(practicalMarks),
      num_modules: toNumber(numModules),
      num_experiments: toNumber(numExperiments),
      num_assignments: toNumber(numAssignments),
      experiments: experiments.trim() || undefined,
      theory: theory.trim() || undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={subject.id ? 'Edit Subject' : 'Add Subject'}
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
            onClick={handleSubmit}
          >
            Save
          </button>
        </>
      }
    >
      <div className="grid gap-4">
        <Section label="Core" />
        <Field label="Subject Name *" value={subjectName} onChange={setSubjectName} />
        <Field label="Subject Code *" value={subjectCode} onChange={setSubjectCode} />
        <label className="grid gap-1 text-sm text-ink">
          Semester
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={semester}
            onChange={(event) => setSemester(Number(event.target.value))}
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((sem) => (
              <option key={sem} value={sem}>
                Sem {sem}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-ink">
          Branch
          <select
            className="rounded-xl border border-border px-3 py-2"
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
        <label className="grid gap-1 text-sm text-ink">
          Academic Year
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={acadYear}
            onChange={(event) => setAcadYear(event.target.value)}
          >
            {academicYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Weekly Required Hours"
          value={weeklyHours}
          onChange={setWeeklyHours}
          type="number"
        />
        <Field
          label="Semester Hours"
          value={semesterHours}
          onChange={setSemesterHours}
          type="number"
        />

        <Section label="Assign Teacher" />
        <label className="grid gap-1 text-sm text-ink">
          Assigned Professor
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={professorAssign}
            onChange={(event) => setProfessorAssign(event.target.value)}
          >
            <option value="">-- None --</option>
            {faculty.map((member) => (
              <option key={member.faculty_id} value={member.faculty_id}>
                {member.name || `Faculty ${member.faculty_id}`}
              </option>
            ))}
          </select>
        </label>

        <Section label="Type & Marks" />
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isPractical}
            onChange={(event) => setIsPractical(event.target.checked)}
          />
          Lab / Practical Subject
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={isOral}
            onChange={(event) => setIsOral(event.target.checked)}
          />
          Has Oral Exam
        </label>
        <Field label="Max Marks" value={maxMarks} onChange={setMaxMarks} type="number" />
        <Field
          label="Passing Marks"
          value={passingMarks}
          onChange={setPassingMarks}
          type="number"
        />
        {isOral ? (
          <Field
            label="Oral Marks"
            value={oralMarks}
            onChange={setOralMarks}
            type="number"
          />
        ) : null}
        {isPractical ? (
          <Field
            label="Practical Marks"
            value={practicalMarks}
            onChange={setPracticalMarks}
            type="number"
          />
        ) : null}

        <Section label="Course Content" />
        <Field
          label="No. of Modules"
          value={numModules}
          onChange={setNumModules}
          type="number"
        />
        <Field
          label="No. of Experiments"
          value={numExperiments}
          onChange={setNumExperiments}
          type="number"
        />
        <Field
          label="No. of Assignments"
          value={numAssignments}
          onChange={setNumAssignments}
          type="number"
        />
        <Field
          label="Experiments"
          value={experiments}
          onChange={setExperiments}
          multiline
        />
        <Field label="Theory" value={theory} onChange={setTheory} multiline />
      </div>
    </Modal>
  )
}

const Section = ({ label }: { label: string }) => (
  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
    {label}
  </div>
)

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  multiline?: boolean
}) => (
  <label className="grid gap-1 text-sm text-ink">
    {label}
    {multiline ? (
      <textarea
        className="rounded-xl border border-border px-3 py-2"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    ) : (
      <input
        className="rounded-xl border border-border px-3 py-2"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </label>
)
