import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { createFaculty, getAll, removeFaculty, updateFaculty } from '../api/faculty'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Faculty } from '../types/faculty'
import { branchMap } from '../utils/branch'

const departments = {
  1: 'Computer Science',
  2: 'Information Technology',
  3: 'Electronics',
  4: 'Mechanical',
  5: 'General',
} as const

export const ManageTeachersPage = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Faculty | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Faculty | null>(null)

  const loadFaculty = () => {
    setLoading(true)
    setError(null)
    getAll()
      .then((data) => setFaculty(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load faculty'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFaculty()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return faculty.filter((member) => {
      if (!q) return true
      return (
        member.name?.toLowerCase().includes(q) ||
        member.email?.toLowerCase().includes(q)
      )
    })
  }, [faculty, search])

  const handleSave = async (payload: Partial<Faculty>, existing?: Faculty | null) => {
    if (existing) {
      await updateFaculty(existing.faculty_id, payload)
    } else {
      await createFaculty(payload)
    }
    loadFaculty()
  }

  const handleDelete = async (member: Faculty) => {
    await removeFaculty(member.faculty_id)
    loadFaculty()
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
          <h1 className="text-2xl font-semibold text-ink">Manage Teachers</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadFaculty}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditing({
              faculty_id: 0,
              name: '',
              email: '',
            })}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-white px-5 py-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Search className="h-4 w-4" />
          </div>
          <input
            className="flex-1 border-0 bg-transparent text-sm text-ink outline-none"
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-ink-muted">Loading teachers...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No teachers found"
          subtitle={search ? 'Try a different search term.' : 'Add your first teacher.'}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((member) => (
            <div
              key={member.faculty_id}
              className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {member.name || 'Faculty'}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {member.email || 'No email'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
                    {member.branch_id ? (
                      <span>Branch {branchMap[member.branch_id] ?? member.branch_id}</span>
                    ) : null}
                    {member.contact ? <span>{member.contact}</span> : null}
                    {member.weekly_work_hours ? (
                      <span>{member.weekly_work_hours} hrs/week</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setEditing(member)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-error/30 bg-error/10 px-3 py-1 text-xs font-semibold text-error"
                    onClick={() => setConfirmDelete(member)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TeacherFormModal
        teacher={editing}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          handleSave(payload, editing?.faculty_id ? editing : null).finally(() =>
            setEditing(null),
          )
        }}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        title="Delete Teacher"
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
          Delete {confirmDelete?.name || 'this teacher'}? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

const TeacherFormModal = ({
  teacher,
  isOpen,
  onClose,
  onSave,
}: {
  teacher: Faculty | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<Faculty>) => void
}) => {
  const [name, setName] = useState(teacher?.name ?? '')
  const [email, setEmail] = useState(teacher?.email ?? '')
  const [contact, setContact] = useState(teacher?.contact ?? '')
  const [facultyClgId, setFacultyClgId] = useState(teacher?.faculty_clg_id ?? '')
  const [branchId, setBranchId] = useState<number>(teacher?.branch_id ?? 1)
  const [departId, setDepartId] = useState<number | ''>(teacher?.depart_id ?? '')
  const [role, setRole] = useState(teacher?.role ?? '')
  const [weeklyHours, setWeeklyHours] = useState(
    teacher?.weekly_work_hours?.toString() ?? '18',
  )
  const [qualification, setQualification] = useState(teacher?.qualification ?? '')
  const [gender, setGender] = useState(teacher?.gender ?? 'Male')
  const [dob, setDob] = useState(teacher?.dob ?? '')
  const [joiningDate, setJoiningDate] = useState(teacher?.joining_date ?? '')
  const [bloodGroup, setBloodGroup] = useState(teacher?.blood_group ?? '')
  const [panNo, setPanNo] = useState(teacher?.pan_no ?? '')
  const [aadharCard, setAadharCard] = useState(teacher?.aadhar_card ?? '')
  const [alternateMobile, setAlternateMobile] = useState(
    teacher?.alternate_mobile ?? '',
  )
  const [permanentAddress, setPermanentAddress] = useState(
    teacher?.permanent_address ?? '',
  )
  const [currentAddress, setCurrentAddress] = useState(
    teacher?.current_address ?? '',
  )
  const [experienceDetails, setExperienceDetails] = useState(
    teacher?.experience_details ?? '',
  )
  const [ftypeId, setFtypeId] = useState(teacher?.ftype_id?.toString() ?? '')
  const [shiftId, setShiftId] = useState(teacher?.shift_id?.toString() ?? '')
  const [privilege, setPrivilege] = useState(teacher?.previlage?.toString() ?? '')
  const [status, setStatus] = useState(teacher?.status ?? 1)

  useEffect(() => {
    if (!teacher) return
    setName(teacher.name ?? '')
    setEmail(teacher.email ?? '')
    setContact(teacher.contact ?? '')
    setFacultyClgId(teacher.faculty_clg_id ?? '')
    setBranchId(teacher.branch_id ?? 1)
    setDepartId(teacher.depart_id ?? '')
    setRole(teacher.role ?? '')
    setWeeklyHours(teacher.weekly_work_hours?.toString() ?? '18')
    setQualification(teacher.qualification ?? '')
    setGender(teacher.gender ?? 'Male')
    setDob(teacher.dob ?? '')
    setJoiningDate(teacher.joining_date ?? '')
    setBloodGroup(teacher.blood_group ?? '')
    setPanNo(teacher.pan_no ?? '')
    setAadharCard(teacher.aadhar_card ?? '')
    setAlternateMobile(teacher.alternate_mobile ?? '')
    setPermanentAddress(teacher.permanent_address ?? '')
    setCurrentAddress(teacher.current_address ?? '')
    setExperienceDetails(teacher.experience_details ?? '')
    setFtypeId(teacher.ftype_id?.toString() ?? '')
    setShiftId(teacher.shift_id?.toString() ?? '')
    setPrivilege(teacher.previlage?.toString() ?? '')
    setStatus(teacher.status ?? 1)
  }, [teacher])

  if (!teacher) return null

  const toNumber = (value: string) => (value.trim() ? Number(value) : undefined)

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return
    onSave({
      name: name.trim(),
      email: email.trim(),
      contact: contact.trim() || undefined,
      faculty_clg_id: facultyClgId.trim() || undefined,
      branch_id: branchId,
      depart_id: departId ? Number(departId) : undefined,
      role: role.trim() || undefined,
      weekly_work_hours: toNumber(weeklyHours),
      qualification: qualification.trim() || undefined,
      gender: gender || undefined,
      dob: dob || undefined,
      joining_date: joiningDate || undefined,
      blood_group: bloodGroup.trim() || undefined,
      pan_no: panNo.trim() || undefined,
      aadhar_card: aadharCard.trim() || undefined,
      alternate_mobile: alternateMobile.trim() || undefined,
      permanent_address: permanentAddress.trim() || undefined,
      current_address: currentAddress.trim() || undefined,
      experience_details: experienceDetails.trim() || undefined,
      ftype_id: toNumber(ftypeId),
      shift_id: toNumber(shiftId),
      previlage: toNumber(privilege),
      status,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={teacher.faculty_id ? 'Edit Teacher' : 'Add Teacher'}
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
        <Section label="Basic Information" />
        <Field label="Full Name *" value={name} onChange={setName} />
        <Field label="Email *" value={email} onChange={setEmail} type="email" />
        <Field label="Contact" value={contact} onChange={setContact} />
        <Field label="College ID" value={facultyClgId} onChange={setFacultyClgId} />

        <Section label="Department & Branch" />
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
          Department
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={departId}
            onChange={(event) =>
              setDepartId(event.target.value ? Number(event.target.value) : '')
            }
          >
            <option value="">Select Department</option>
            {Object.entries(departments).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Role" value={role} onChange={setRole} />
        <Field
          label="Weekly Work Hours"
          value={weeklyHours}
          onChange={setWeeklyHours}
          type="number"
        />
        <Field label="Qualification" value={qualification} onChange={setQualification} />

        <Section label="Personal Details" />
        <label className="grid gap-1 text-sm text-ink">
          Gender
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <Field label="Date of Birth" value={dob} onChange={setDob} type="date" />
        <Field
          label="Joining Date"
          value={joiningDate}
          onChange={setJoiningDate}
          type="date"
        />
        <Field label="Blood Group" value={bloodGroup} onChange={setBloodGroup} />
        <Field label="PAN No" value={panNo} onChange={setPanNo} />
        <Field label="Aadhar No" value={aadharCard} onChange={setAadharCard} />
        <Field
          label="Alternate Mobile"
          value={alternateMobile}
          onChange={setAlternateMobile}
        />

        <Section label="Address & Experience" />
        <Field
          label="Permanent Address"
          value={permanentAddress}
          onChange={setPermanentAddress}
          multiline
        />
        <Field
          label="Current Address"
          value={currentAddress}
          onChange={setCurrentAddress}
          multiline
        />
        <Field
          label="Experience Details"
          value={experienceDetails}
          onChange={setExperienceDetails}
          multiline
        />

        <Section label="Access & Status" />
        <Field label="Faculty Type ID" value={ftypeId} onChange={setFtypeId} />
        <Field label="Shift ID" value={shiftId} onChange={setShiftId} />
        <Field label="Privilege" value={privilege} onChange={setPrivilege} />
        <label className="grid gap-1 text-sm text-ink">
          Status
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={status}
            onChange={(event) => setStatus(Number(event.target.value))}
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </label>
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
