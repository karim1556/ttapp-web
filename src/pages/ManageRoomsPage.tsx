import { useEffect, useMemo, useState } from 'react'
import { Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { createRoom, getAll, removeRoom, updateRoom } from '../api/rooms'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import type { Room } from '../types/room'
import { branchMap } from '../utils/branch'

const roomTypes = ['Classroom', 'Lab', 'Tutorial', 'Seminar Hall', 'Office']

export const ManageRoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Room | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Room | null>(null)

  const loadRooms = (branch?: number | null) => {
    setLoading(true)
    setError(null)
    getAll(branch ? { branch_id: branch } : undefined)
      .then((data) => setRooms(data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Unable to load rooms'
        setError(message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRooms()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rooms.filter((room) => {
      const matchesQuery =
        !q ||
        room.room_number.toLowerCase().includes(q) ||
        (room.name?.toLowerCase().includes(q) ?? false)
      const matchesBranch = branchFilter === null || room.branch_id === branchFilter
      return matchesQuery && matchesBranch
    })
  }, [rooms, search, branchFilter])

  const handleSave = async (payload: Partial<Room>, existing?: Room | null) => {
    if (existing) {
      await updateRoom(existing.id, payload)
    } else {
      await createRoom(payload)
    }
    loadRooms(branchFilter)
  }

  const handleDelete = async (room: Room) => {
    await removeRoom(room.id)
    loadRooms(branchFilter)
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Admin</p>
          <h1 className="text-2xl font-semibold text-ink">Manage Rooms</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadRooms(branchFilter)}
            className="rounded-xl border border-border bg-white px-3 py-2 text-ink-muted"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setEditing({
                id: 0,
                room_number: '',
              } as Room)
            }
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Room
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
              placeholder="Search rooms..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="rounded-xl border border-border px-3 py-2 text-sm text-ink"
            value={branchFilter ?? ''}
            onChange={(event) => {
              const value = event.target.value
              const branch = value ? Number(value) : null
              setBranchFilter(branch)
              loadRooms(branch)
            }}
          >
            <option value="">All Branches</option>
            {Object.entries(branchMap).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
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
        <div className="text-sm text-ink-muted">Loading rooms...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No rooms found"
          subtitle={search ? 'Try a different search term.' : 'Add your first room.'}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-ink">
                    {room.room_number}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {room.name || room.room_type || 'Room'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
                    {room.capacity ? <span>Capacity {room.capacity}</span> : null}
                    {room.branch_id ? (
                      <span>{branchMap[room.branch_id] ?? room.branch_id}</span>
                    ) : null}
                    {room.floor ? <span>Floor {room.floor}</span> : null}
                    {room.is_active === 0 ? <span>Inactive</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-ink"
                    onClick={() => setEditing(room)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-error/30 bg-error/10 px-3 py-1 text-xs font-semibold text-error"
                    onClick={() => setConfirmDelete(room)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomFormModal
        room={editing}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSave={(payload) => {
          handleSave(payload, editing?.id ? editing : null).finally(() => setEditing(null))
        }}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        title="Delete Room"
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
          Delete {confirmDelete?.room_number}? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

const RoomFormModal = ({
  room,
  isOpen,
  onClose,
  onSave,
}: {
  room: Room | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: Partial<Room>) => void
}) => {
  const [roomNumber, setRoomNumber] = useState(room?.room_number ?? '')
  const [name, setName] = useState(room?.name ?? '')
  const [roomType, setRoomType] = useState(room?.room_type ?? 'Classroom')
  const [capacity, setCapacity] = useState(room?.capacity?.toString() ?? '')
  const [floor, setFloor] = useState(room?.floor ?? '')
  const [branchId, setBranchId] = useState<number | ''>(room?.branch_id ?? '')
  const [isActive, setIsActive] = useState(room?.is_active ?? 1)

  useEffect(() => {
    if (!room) return
    setRoomNumber(room.room_number ?? '')
    setName(room.name ?? '')
    setRoomType(room.room_type ?? 'Classroom')
    setCapacity(room.capacity?.toString() ?? '')
    setFloor(room.floor ?? '')
    setBranchId(room.branch_id ?? '')
    setIsActive(room.is_active ?? 1)
  }, [room])

  if (!room) return null

  const handleSubmit = () => {
    if (!roomNumber.trim()) return
    onSave({
      room_number: roomNumber.trim(),
      name: name.trim() || undefined,
      room_type: roomType || undefined,
      capacity: capacity.trim() ? Number(capacity) : undefined,
      floor: floor.trim() || undefined,
      branch_id: branchId ? Number(branchId) : undefined,
      is_active: isActive,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      title={room.id ? 'Edit Room' : 'Add Room'}
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
        <Field label="Room Number *" value={roomNumber} onChange={setRoomNumber} />
        <Field label="Name / Description" value={name} onChange={setName} />
        <label className="grid gap-1 text-sm text-ink">
          Room Type
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={roomType}
            onChange={(event) => setRoomType(event.target.value)}
          >
            {roomTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <Field label="Capacity" value={capacity} onChange={setCapacity} type="number" />
        <Field label="Floor" value={floor} onChange={setFloor} />
        <label className="grid gap-1 text-sm text-ink">
          Branch
          <select
            className="rounded-xl border border-border px-3 py-2"
            value={branchId}
            onChange={(event) =>
              setBranchId(event.target.value ? Number(event.target.value) : '')
            }
          >
            <option value="">All Branches / General</option>
            {Object.entries(branchMap).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
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
