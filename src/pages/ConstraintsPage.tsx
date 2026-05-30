import { useEffect, useState } from 'react'
import { Plus, Trash2, Clock, Save } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { getByFacultyId, createConstraint, updateConstraint } from '../api/constraints'
import { LoadingScreen } from '../components/LoadingScreen'
import { Modal } from '../components/Modal'
import { daysOfWeek } from '../utils/date'

const TIME_SLOTS = Array.from({ length: 8 }, (_, i) => ({
  hour: 8 + i,
  label: `Slot ${i + 1} (${8 + i}:00 - ${8 + i + 1}:00)`,
}))

export const ConstraintsPage = () => {
  const { user } = useAuth()
  const facultyId = user?.faculty?.faculty_id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [constraint, setConstraint] = useState<any | null>(null)
  const [isEditing, setEditing] = useState(false)

  // Local form state
  const [maxPerDay, setMaxPerDay] = useState(4)
  const [totalPerWeek, setTotalPerWeek] = useState(20)
  const [unavailableSlots, setUnavailableSlots] = useState<{ day: string; startHour: number; startMinutes: number; endHour: number; endMinutes: number }[]>([])
  const [preferredSlots, setPreferredSlots] = useState<{ day: string; startHour: number; startMinutes: number; endHour: number; endMinutes: number }[]>([])

  // Slot picker dialog state
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [slotDialogMode, setSlotDialogMode] = useState<'unavailable' | 'preferred'>('unavailable')
  const [slotDay, setSlotDay] = useState('Monday')
  const [slotHour, setSlotHour] = useState(8)

  useEffect(() => {
    if (!facultyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getByFacultyId(facultyId)
      .then((data) => {
        setConstraint(data)
        if (data) {
          setMaxPerDay(data.max_lectures_per_day ?? 4)
          setTotalPerWeek(data.total_lectures_per_week ?? 20)
          setUnavailableSlots(data.unavailable_slots ?? [])
          setPreferredSlots(data.preferred_slots ?? [])
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false))
  }, [facultyId])

  const openEdit = () => {
    if (constraint) {
      setMaxPerDay(constraint.max_lectures_per_day ?? 4)
      setTotalPerWeek(constraint.total_lectures_per_week ?? 20)
      setUnavailableSlots(constraint.unavailable_slots ?? [])
      setPreferredSlots(constraint.preferred_slots ?? [])
    }
    setEditing(true)
  }

  const handleSave = async () => {
    if (!facultyId) return
    setSaving(true)
    try {
      const payload = {
        faculty_id: facultyId,
        max_lectures_per_day: maxPerDay,
        total_lectures_per_week: totalPerWeek,
        unavailable_slots: unavailableSlots,
        preferred_slots: preferredSlots,
      }
      if (constraint?.id) {
        await updateConstraint(constraint.id, payload)
      } else {
        await createConstraint(payload)
      }
      // Reload
      const data = await getByFacultyId(facultyId)
      setConstraint(data)
    } catch {
      // ignore
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const openAddSlot = (mode: 'unavailable' | 'preferred') => {
    setSlotDialogMode(mode)
    setSlotDay('Monday')
    setSlotHour(8)
    setSlotDialogOpen(true)
  }

  const addSlot = () => {
    const slot = {
      day: slotDay,
      startHour: slotHour,
      startMinutes: 0,
      endHour: slotHour + 1,
      endMinutes: 0,
    }
    if (slotDialogMode === 'unavailable') {
      setUnavailableSlots((prev) => [...prev, slot])
    } else {
      setPreferredSlots((prev) => [...prev, slot])
    }
    setSlotDialogOpen(false)
  }

  if (!facultyId) return <div className="text-sm text-ink-muted">No faculty profile available.</div>
  if (loading) return <LoadingScreen label="Loading constraints..." />

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Constraints</p>
          <h1 className="text-2xl font-semibold text-ink">Teaching Availability</h1>
        </div>
        <div>
          <button
            type="button"
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
            onClick={openEdit}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-border bg-blue-50 px-4 py-3 text-sm text-blue-700">
        These constraints help the AI scheduler assign your lectures.
        Mark slots you are unavailable, and optionally preferred timings.
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white px-4 py-3">
          <div className="text-xs text-ink-muted">Max lectures per day</div>
          <div className="mt-1 text-2xl font-semibold text-brand">{constraint?.max_lectures_per_day ?? '—'}</div>
        </div>
        <div className="rounded-2xl border border-border bg-white px-4 py-3">
          <div className="text-xs text-ink-muted">Total lectures per week</div>
          <div className="mt-1 text-2xl font-semibold text-brand">{constraint?.total_lectures_per_week ?? '—'}</div>
        </div>
      </div>

      {/* Unavailable slots */}
      <div className="rounded-2xl border border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Unavailable Slots</h3>
          <button
            type="button"
            className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
            disabled
          >
            {constraint?.unavailable_slots?.length ?? 0} slots
          </button>
        </div>
        {(!constraint?.unavailable_slots || constraint.unavailable_slots.length === 0) ? (
          <div className="mt-2 text-sm text-ink-muted">None set.</div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {constraint.unavailable_slots.map((slot: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-2 py-1 text-xs text-error">
                <Clock className="h-3 w-3" />
                {slot.day} — {slot.startHour}:00
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preferred slots */}
      <div className="rounded-2xl border border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Preferred Slots</h3>
          <button
            type="button"
            className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
            disabled
          >
            {constraint?.preferred_slots?.length ?? 0} slots
          </button>
        </div>
        {(!constraint?.preferred_slots || constraint.preferred_slots.length === 0) ? (
          <div className="mt-2 text-sm text-ink-muted">None set.</div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {constraint.preferred_slots.map((slot: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-xl border border-green/30 bg-green-50 px-2 py-1 text-xs text-green-700">
                <Clock className="h-3 w-3" />
                {slot.day} — {slot.startHour}:00
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        title="Edit Scheduling Constraints"
        onClose={() => setEditing(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-xl border border-border px-4 py-2 text-sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white flex items-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="grid gap-5">
          {/* Max lectures per day */}
          <div>
            <label className="text-sm font-semibold text-ink">Max Lectures Per Day</label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={8}
                value={maxPerDay}
                onChange={(event) => setMaxPerDay(Number(event.target.value))}
                className="flex-1"
              />
              <span className="min-w-[3rem] text-right text-sm font-bold text-brand">{maxPerDay}</span>
            </div>
          </div>

          {/* Total lectures per week */}
          <div>
            <label className="text-sm font-semibold text-ink">Total Lectures Per Week</label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={30}
                value={totalPerWeek}
                onChange={(event) => setTotalPerWeek(Number(event.target.value))}
                className="flex-1"
              />
              <span className="min-w-[3rem] text-right text-sm font-bold text-brand">{totalPerWeek}</span>
            </div>
          </div>

          {/* Unavailable slots editor */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink">Unavailable Slots</label>
              <button
                type="button"
                className="rounded-xl bg-error/10 px-3 py-1 text-xs font-semibold text-error flex items-center gap-1"
                onClick={() => openAddSlot('unavailable')}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {unavailableSlots.map((slot, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-xl border border-error/30 bg-error/10 px-2 py-1 text-xs text-error">
                  <Clock className="h-3 w-3" />
                  {slot.day} — {slot.startHour}:00
                  <button
                    type="button"
                    className="ml-1 text-error/70 hover:text-error"
                    onClick={() => setUnavailableSlots((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {unavailableSlots.length === 0 && (
                <span className="text-xs text-ink-muted">No unavailable slots. Tap + to add.</span>
              )}
            </div>
          </div>

          {/* Preferred slots editor */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink">Preferred Slots (optional)</label>
              <button
                type="button"
                className="rounded-xl bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 flex items-center gap-1"
                onClick={() => openAddSlot('preferred')}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {preferredSlots.map((slot, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-xl border border-green/30 bg-green-50 px-2 py-1 text-xs text-green-700">
                  <Clock className="h-3 w-3" />
                  {slot.day} — {slot.startHour}:00
                  <button
                    type="button"
                    className="ml-1 text-green-500/70 hover:text-green-700"
                    onClick={() => setPreferredSlots((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {preferredSlots.length === 0 && (
                <span className="text-xs text-ink-muted">No preferred slots. Tap + to add.</span>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Slot picker dialog */}
      <Modal
        isOpen={slotDialogOpen}
        title={slotDialogMode === 'unavailable' ? 'Add Unavailable Slot' : 'Add Preferred Slot'}
        onClose={() => setSlotDialogOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-xl border border-border px-4 py-2 text-sm" onClick={() => setSlotDialogOpen(false)}>Cancel</button>
            <button type="button" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white" onClick={addSlot}>Add</button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-ink">
            Day
            <select
              className="rounded-xl border border-border px-3 py-2"
              value={slotDay}
              onChange={(event) => setSlotDay(event.target.value)}
            >
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-ink">
            Time Slot
            <select
              className="rounded-xl border border-border px-3 py-2"
              value={slotHour}
              onChange={(event) => setSlotHour(Number(event.target.value))}
            >
              {TIME_SLOTS.map((ts) => (
                <option key={ts.hour} value={ts.hour}>{ts.label}</option>
              ))}
            </select>
          </label>
        </div>
      </Modal>
    </div>
  )
}

export default ConstraintsPage