import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, Search, Trash2, Users } from 'lucide-react'
import { getAll, createCourse, updateCourse, removeCourse, getUsers, addUsers, removeUser } from '../api/copo'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { LoadingScreen } from '../components/LoadingScreen'
import type { CopoCourse } from '../types/copo'
import { branchMap } from '../utils/branch'

export const CopoPage = () => {
  const [courses, setCourses] = useState<CopoCourse[]>([])
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<number | null>(null)
  const [semesterFilter, setSemesterFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<CopoCourse | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CopoCourse | null>(null)
  const [manageUsers, setManageUsers] = useState<CopoCourse | null>(null)
  const [users, setUsers] = useState<{ user_id: number; user: { uid: number; email: string; user_type: number } }[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  const loadCourses = () => {
    setLoading(true)
    setError(null)
    const query: { branch?: number; semester?: number } = {}
    if (branchFilter !== null) query.branch = branchFilter
    if (semesterFilter) query.semester = Number(semesterFilter)
    getAll(Object.keys(query).length ? query : undefined)
      .then((data) => setCourses(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCourses() }, [branchFilter, semesterFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses.filter((c) => {
      if (!q) return true
      return (
        (c.subjectCode?.toLowerCase().includes(q) ?? false) ||
        (c.subjectName?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [courses, search])

  const handleSave = async (payload: Partial<CopoCourse>, existing?: CopoCourse | null) => {
    if (existing) {
      await updateCourse(existing.usercourse_id, payload)
    } else {
      await createCourse(payload)
    }
    loadCourses()
  }

  const handleDelete = async (course: CopoCourse) => {
    await removeCourse(course.usercourse_id)
    loadCourses()
  }

  const loadUsers = async (course: CopoCourse) => {
    setUsersLoading(true)
    try {
      const data = await getUsers(course.usercourse_id)
      setUsers(data)
    } catch {
      setUsers([])
    }
    setUsersLoading(false)
  }

  if (loading) return <LoadingScreen label="Loading COPO courses..." />

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">COPO</p>
          <h1 className="text-2xl font-semibold text-ink">Course Outcome Mapping</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCourses}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing({ usercourse_id: 0 } as CopoCourse)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Course
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
              placeholder="Search courses..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
            value={branchFilter ?? ''}
            onChange={(event) => setBranchFilter(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">All Branches</option>
            {Object.entries(branchMap).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
            value={semesterFilter}
            onChange={(event) => setSemesterFilter(event.target.value)}
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No courses found"
          subtitle={search ? 'Try a different search term.' : 'Add your first course mapping.'}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((course) => (
            <div key={course.usercourse_id} className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ink">{course.subjectName || course.subjectCode || `Course #${course.usercourse_id}`}</div>
                  <div className="text-xs text-ink-muted">
                    {course.subjectCode ? `${course.subjectCode} · ` : ''}
                    {course.branchLabel ?? (course.branch ? branchMap[course.branch] ?? `Branch ${course.branch}` : '')}
                    {course.semester ? ` · Sem ${course.semester}` : ''}
                    {course.academic_year ? ` · ${course.academic_year}` : ''}
                  </div>
                  {course.co_count != null ? (
                    <div className="mt-1 text-xs text-ink-muted">CO Count: {course.co_count}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => {
                      setManageUsers(course)
                      loadUsers(course)
                    }}
                  >
                    <Users className="mr-1 inline h-3 w-3" />
                    Users
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setEditing(course)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-error/30 bg-error/10 px-3 py-1 text-xs font-semibold text-error"
                    onClick={() => setConfirmDelete(course)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CourseFormModal
        course={editing}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          handleSave(payload, editing?.usercourse_id ? editing : null).finally(() => setEditing(null))
        }}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        title="Delete Course Mapping"
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button type="button" className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button type="button" className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white" onClick={() => {
              if (confirmDelete) handleDelete(confirmDelete).finally(() => setConfirmDelete(null))
            }}>Delete</button>
          </>
        }
      >
        <p className="text-sm text-ink">Delete mapping for {confirmDelete?.subjectName || confirmDelete?.subjectCode || `#${confirmDelete?.usercourse_id}`}? This cannot be undone.</p>
      </Modal>

      <UsersModal
        course={manageUsers}
        users={users}
        loading={usersLoading}
        isOpen={Boolean(manageUsers)}
        onClose={() => {
          setManageUsers(null)
          setUsers([])
        }}
        onRemoveUser={async (userId) => {
          if (!manageUsers) return
          await removeUser(manageUsers.usercourse_id, userId)
          loadUsers(manageUsers)
        }}
        onAddUser={async (userId) => {
          if (!manageUsers) return
          await addUsers(manageUsers.usercourse_id, [userId])
          loadUsers(manageUsers)
        }}
      />
    </div>
  )
}

const CourseFormModal = ({
  course,
  isOpen,
  onClose,
  onSave,
}: {
  course: CopoCourse | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<CopoCourse>) => void
}) => {
  const [subjectCode, setSubjectCode] = useState(course?.subjectCode ?? '')
  const [subjectName, setSubjectName] = useState(course?.subjectName ?? '')
  const [branch, setBranch] = useState<number | ''>(course?.branch ?? '')
  const [semester, setSemester] = useState<number | ''>(course?.semester ?? '')
  const [academicYear, setAcademicYear] = useState(course?.academic_year ?? '')
  const [coCount, setCoCount] = useState(course?.co_count?.toString() ?? '')

  useEffect(() => {
    if (!course) return
    setSubjectCode(course.subjectCode ?? '')
    setSubjectName(course.subjectName ?? '')
    setBranch(course.branch ?? '')
    setSemester(course.semester ?? '')
    setAcademicYear(course.academic_year ?? '')
    setCoCount(course.co_count?.toString() ?? '')
  }, [course])

  if (!course) return null

  const handleSubmit = () => {
    onSave({
      subjectCode: subjectCode.trim() || undefined,
      subjectName: subjectName.trim() || undefined,
      branch: branch ? Number(branch) : undefined,
      semester: semester ? Number(semester) : undefined,
      academic_year: academicYear.trim() || undefined,
      co_count: coCount.trim() ? Number(coCount) : undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={course.usercourse_id ? 'Edit Course Mapping' : 'Add Course Mapping'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="rounded-xl border border-border px-4 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={handleSubmit}>Save</button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label="Subject Code" value={subjectCode} onChange={setSubjectCode} />
        <Field label="Subject Name" value={subjectName} onChange={setSubjectName} />
        <label className="grid gap-1 text-sm text-ink">
          Branch
          <select className="rounded-xl border border-border px-3 py-2" value={branch} onChange={(event) => setBranch(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Select Branch</option>
            {Object.entries(branchMap).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-ink">
          Semester
          <select className="rounded-xl border border-border px-3 py-2" value={semester} onChange={(event) => setSemester(event.target.value ? Number(event.target.value) : '')}>
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </label>
        <Field label="Academic Year (e.g. 2025-26)" value={academicYear} onChange={setAcademicYear} />
        <Field label="CO Count" value={coCount} onChange={setCoCount} type="number" />
      </div>
    </Modal>
  )
}

const UsersModal = ({
  course,
  users,
  loading,
  isOpen,
  onClose,
  onRemoveUser,
  onAddUser,
}: {
  course: CopoCourse | null
  users: { user_id: number; user: { uid: number; email: string; user_type: number } }[]
  loading: boolean
  isOpen: boolean
  onClose: () => void
  onRemoveUser: (userId: number) => void
  onAddUser: (userId: number) => void
}) => {
  const [newUserId, setNewUserId] = useState('')

  if (!course) return null

  const handleAdd = () => {
    const id = Number(newUserId)
    if (!id) return
    onAddUser(id)
    setNewUserId('')
  }

  return (
    <Modal
      isOpen={isOpen}
      title={`Users — ${course.subjectName || course.subjectCode || `#${course.usercourse_id}`}`}
      onClose={onClose}
      footer={
        <button type="button" className="rounded-xl border border-border px-4 py-2 text-sm" onClick={onClose}>Close</button>
      }
    >
      <div className="grid gap-3">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
            type="number"
            placeholder="User ID to add..."
            value={newUserId}
            onChange={(event) => setNewUserId(event.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            onClick={handleAdd}
          >
            Add
          </button>
        </div>
        <div className="grid gap-2">
          {loading ? (
            <div className="text-sm text-ink-muted">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-ink-muted">No users enrolled.</div>
          ) : (
            users.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <div className="text-sm text-ink">
                  <span className="font-semibold">#{u.user.uid}</span> — {u.user.email}
                  <span className="ml-2 text-xs text-ink-muted">Type: {u.user.user_type}</span>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-error/30 bg-error/10 px-2 py-1 text-xs text-error"
                  onClick={() => onRemoveUser(u.user_id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) => (
  <label className="grid gap-1 text-sm text-ink">
    {label}
    <input className="rounded-xl border border-border px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
)

export default CopoPage