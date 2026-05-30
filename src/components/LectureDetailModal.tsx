import { BookOpen, Layers, School, Users } from 'lucide-react'
import type { TimetableLecture, TimetableSlot } from '../types/timetable'
import { Modal } from './Modal'
import { formatSlotRange, isLabLecture } from '../utils/timetable'

export const LectureDetailModal = ({
  slot,
  isOpen,
  onClose,
  onEditLecture,
  onSubstituteLecture,
}: {
  slot: TimetableSlot | null
  isOpen: boolean
  onClose: () => void
  onEditLecture?: (lecture: TimetableLecture) => void
  onSubstituteLecture?: (lecture: TimetableLecture) => void
}) => {
  if (!slot) return null

  return (
    <Modal
      isOpen={isOpen}
      title={`Slot • ${formatSlotRange(slot)}`}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 text-sm"
          onClick={onClose}
        >
          Close
        </button>
      }
    >
      <div className="grid gap-4">
        {slot.lectures.length ? (
          slot.lectures.map((lecture) => (
            <div
              key={lecture.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isLabLecture(lecture)
                        ? 'bg-lab-bg text-lab-text'
                        : 'bg-brand-light text-brand'
                    }`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-ink">
                      {lecture.subject_name || lecture.subjectCode || 'Lecture'}
                    </div>
                    {lecture.subjectCode ? (
                      <div className="text-xs text-ink-muted">
                        {lecture.subjectCode}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  {onEditLecture ? (
                    <button
                      type="button"
                      className="rounded-xl border border-border px-3 py-1 text-xs font-semibold text-brand"
                      onClick={() => onEditLecture(lecture)}
                    >
                      Edit
                    </button>
                  ) : null}
                  {onSubstituteLecture ? (
                    <button
                      type="button"
                      className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning"
                      onClick={() => onSubstituteLecture(lecture)}
                    >
                      Substitute
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                {lecture.typeOfLecture ? (
                  <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1">
                    <Layers className="h-3 w-3" />
                    {lecture.typeOfLecture}
                  </span>
                ) : null}
                {lecture.faculty_name ? (
                  <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1">
                    <School className="h-3 w-3" />
                    {lecture.faculty_name}
                  </span>
                ) : null}
                {lecture.room_number ? (
                  <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1">
                    <Layers className="h-3 w-3" />
                    Room {lecture.room_number}
                  </span>
                ) : null}
                {lecture.batch ? (
                  <span className="flex items-center gap-1 rounded-lg bg-white px-2 py-1">
                    <Users className="h-3 w-3" />
                    Batch {lecture.batch}
                  </span>
                ) : null}
              </div>
              {lecture.reason ? (
                <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                  {lecture.reason}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-ink-muted">
            No lectures for this slot.
          </div>
        )}
      </div>
    </Modal>
  )
}
