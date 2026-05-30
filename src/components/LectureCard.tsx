import { ChevronRight, Layers, School, Users } from 'lucide-react'
import type { TimetableSlot } from '../types/timetable'
import { formatTime, isLabLecture } from '../utils/timetable'

export const LectureCard = ({
  slot,
  onClick,
  color,
}: {
  slot: TimetableSlot
  onClick?: () => void
  color?: string
}) => {
  const lecture = slot.lectures[0]
  const isBreak = slot.lectures.length === 0
  const lectureCount = slot.lectures.length
  const hasParallel = lectureCount > 1
  const isLab = isLabLecture(lecture)
  const batchSet = new Set(
    slot.lectures
      .map((item) => (item.batch ?? '').trim())
      .filter((item) => item.length > 0),
  )

  if (isBreak) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-break-bg px-4 py-3">
        <div className="w-16 text-sm font-semibold text-break-text">
          {formatTime(slot.startTimeHr, slot.startTimeMinutes)}
        </div>
        <div className="text-sm font-semibold text-break-text">Break</div>
      </div>
    )
  }

  const accent = isLab ? 'var(--color-lab-text)' : color || 'var(--color-primary)'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left shadow-sm transition hover:shadow"
    >
      <div className="flex gap-3">
        <div className="w-16">
          <div className="text-lg font-semibold" style={{ color: accent }}>
            {formatTime(slot.startTimeHr, slot.startTimeMinutes)}
          </div>
          <div className="text-xs font-semibold text-ink-muted">
            {formatTime(slot.endTimeHr, slot.endTimeMinutes)}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-ink">
              {hasParallel
                ? `${lectureCount} Parallel Sessions`
                : lecture?.subject_name || lecture?.subjectCode || 'Lecture'}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${
                  isLab
                    ? 'bg-lab-bg text-lab-text'
                    : 'bg-brand-light text-brand'
                }`}
              >
                {isLab ? 'Lab' : 'Lecture'}
              </span>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-muted">
            {lecture?.faculty_name ? (
              <span className="flex items-center gap-1">
                <School className="h-3 w-3" />
                {lecture.faculty_name}
              </span>
            ) : null}
            {lecture?.room_number ? (
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                Room {lecture.room_number}
              </span>
            ) : null}
            {hasParallel && batchSet.size ? (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Batch {Array.from(batchSet).join('/')}
              </span>
            ) : null}
          </div>
        </div>
        {onClick ? (
          <ChevronRight className="mt-1 h-4 w-4 text-ink-muted" />
        ) : null}
      </div>
    </button>
  )
}
