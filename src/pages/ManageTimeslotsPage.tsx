import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { createTimeSlot, getAll, removeTimeSlot, updateTimeSlot } from '../api/timeslots'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { TimeSlotTemplate } from '../types/timeslot'
import { formatTime } from '../utils/timetable'

export const ManageTimeslotsPage = () => {
  const [timeslots, setTimeslots] = useState<TimeSlotTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<TimeSlotTemplate | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<TimeSlotTemplate | null>(null)

  const loadTimeslots = () => {
    setLoading(true)
    setError(null)
    getAll()
      .then((data) => setTimeslots(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load time slots'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTimeslots()
  }, [])

  const ordered = useMemo(() => {
    return [...timeslots].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [timeslots])

  const handleSave = async (payload: Partial<TimeSlotTemplate>, existing?: TimeSlotTemplate | null) => {
    if (existing) {
      await updateTimeSlot(existing.id, payload)
    } else {
      await createTimeSlot(payload)
    }
    loadTimeslots()
  }

  const handleDelete = async (slot: TimeSlotTemplate) => {
    await removeTimeSlot(slot.id)
    loadTimeslots()
  }

  const moveSlot = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= ordered.length) return
    const current = ordered[index]
    const target = ordered[targetIndex]
    await updateTimeSlot(current.id, { sort_order: target.sort_order })
    await updateTimeSlot(target.id, { sort_order: current.sort_order })
    loadTimeslots()
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
          <h1 className="text-2xl font-semibold text-ink">Configure Time Slots</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadTimeslots}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setEditing({
                id: 0,
                startTimeHr: 8,
                startTimeMinutes: 0,
                endTimeHr: 9,
                endTimeMinutes: 0,
              } as TimeSlotTemplate)
            }
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Slot
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
        Slots are used when generating timetables. Slots marked as Break are skipped during
        scheduling.
      </div>

      {error ? (
        <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-ink-muted">Loading slots...</div>
      ) : ordered.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="No time slots configured"
          subtitle="Add your first time slot to begin."
        />
      ) : (
        <div className="grid gap-3">
          {ordered.map((slot, index) => {
            const isBreak = slot.is_break === 1
            return (
              <div
                key={slot.id}
                className={`flex items-center justify-between rounded-2xl border border-border px-4 py-3 ${
                  isBreak ? 'bg-warning/10' : 'bg-white'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {slot.label || 'Slot'}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatTime(slot.startTimeHr, slot.startTimeMinutes)} -{' '}
                    {formatTime(slot.endTimeHr, slot.endTimeMinutes)}
                    {isBreak ? ' · Break' : ''}
                    {slot.is_active === 0 ? ' · Inactive' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border px-2 py-1 text-xs text-ink-muted"
                    onClick={() => moveSlot(index, -1)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-border px-2 py-1 text-xs text-ink-muted"
                    onClick={() => moveSlot(index, 1)}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setEditing(slot)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-error/30 bg-error/10 px-3 py-1 text-xs font-semibold text-error"
                    onClick={() => setConfirmDelete(slot)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TimeSlotFormModal
        slot={editing}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          handleSave(payload, editing?.id ? editing : null).finally(() => setEditing(null))
        }}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        title="Delete Time Slot"
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
        <p className="text-sm text-ink">Delete this time slot? This cannot be undone.</p>
      </Modal>
    </div>
  )
}

const TimeSlotFormModal = ({
  slot,
  isOpen,
  onClose,
  onSave,
}: {
  slot: TimeSlotTemplate | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<TimeSlotTemplate>) => void
}) => {
  const [label, setLabel] = useState(slot?.label ?? '')
  const [startHr, setStartHr] = useState(slot?.startTimeHr ?? 8)
  const [startMin, setStartMin] = useState(slot?.startTimeMinutes ?? 0)
  const [endHr, setEndHr] = useState(slot?.endTimeHr ?? 9)
  const [endMin, setEndMin] = useState(slot?.endTimeMinutes ?? 0)
  const [isBreak, setIsBreak] = useState(slot?.is_break === 1)
  const [sortOrder, setSortOrder] = useState(slot?.sort_order?.toString() ?? '')
  const [isActive, setIsActive] = useState(slot?.is_active ?? 1)

  useEffect(() => {
    if (!slot) return
    setLabel(slot.label ?? '')
    setStartHr(slot.startTimeHr ?? 8)
    setStartMin(slot.startTimeMinutes ?? 0)
    setEndHr(slot.endTimeHr ?? 9)
    setEndMin(slot.endTimeMinutes ?? 0)
    setIsBreak(slot.is_break === 1)
    setSortOrder(slot.sort_order?.toString() ?? '')
    setIsActive(slot.is_active ?? 1)
  }, [slot])

  if (!slot) return null

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = [0, 15, 30, 45]

  const handleSubmit = () => {
    onSave({
      label: label.trim() || undefined,
      startTimeHr: startHr,
      startTimeMinutes: startMin,
      endTimeHr: endHr,
      endTimeMinutes: endMin,
      is_break: isBreak ? 1 : 0,
      sort_order: sortOrder.trim() ? Number(sortOrder) : undefined,
      is_active: isActive,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={slot.id ? 'Edit Time Slot' : 'Add Time Slot'}
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
      <div className="grid gap-3">
        <Field label="Label" value={label} onChange={setLabel} />
        <div className="grid gap-2">
          <div className="text-sm font-semibold text-ink">Start Time</div>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-xl border border-border px-3 py-2"
              value={startHr}
              onChange={(event) => setStartHr(Number(event.target.value))}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-border px-3 py-2"
              value={startMin}
              onChange={(event) => setStartMin(Number(event.target.value))}
            >
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {String(minute).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-semibold text-ink">End Time</div>
          <div className="grid grid-cols-2 gap-3">
            <select
              className="rounded-xl border border-border px-3 py-2"
              value={endHr}
              onChange={(event) => setEndHr(Number(event.target.value))}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-border px-3 py-2"
              value={endMin}
              onChange={(event) => setEndMin(Number(event.target.value))}
            >
              {minutes.map((minute) => (
                <option key={minute} value={minute}>
                  {String(minute).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={isBreak} onChange={(event) => setIsBreak(event.target.checked)} />
          Break Slot
        </label>
        <Field label="Sort Order" value={sortOrder} onChange={setSortOrder} type="number" />
        <label className="grid gap-1 text-sm text-ink">
          Status
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={isActive}
            onChange={(event) => setIsActive(Number(event.target.value))}
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </label>
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
    <input
      className="rounded-xl border border-border px-3 py-2"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)
