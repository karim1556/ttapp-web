import type { TimetableLecture, TimetableSlot } from '../types/timetable'

export const formatTime = (hour?: number | null, minute?: number | null) => {
  if (hour === undefined || hour === null) return '--:--'
  const h = String(hour).padStart(2, '0')
  const m = String(minute ?? 0).padStart(2, '0')
  return `${h}:${m}`
}

export const formatSlotRange = (slot: TimetableSlot) =>
  `${formatTime(slot.startTimeHr, slot.startTimeMinutes)} - ${formatTime(
    slot.endTimeHr,
    slot.endTimeMinutes,
  )}`

export const isLabLecture = (lecture?: TimetableLecture | null) =>
  lecture?.typeOfLecture?.toLowerCase() === 'lab'

const slotStartMinutes = (slot: TimetableSlot) =>
  (slot.startTimeHr ?? 0) * 60 + (slot.startTimeMinutes ?? 0)

const lectureSignature = (lecture: TimetableLecture) =>
  [
    lecture.subjectCode ?? '',
    lecture.facultyid ?? lecture.faculty_name ?? '',
    lecture.batch ?? '',
    lecture.room_number ?? '',
    (lecture.typeOfLecture ?? '').toLowerCase(),
  ].join('|')

const slotLectureSignatureSet = (slot: TimetableSlot) =>
  new Set(slot.lectures.map(lectureSignature))

const isPureLabSlot = (slot: TimetableSlot) =>
  slot.lectures.length > 0 && slot.lectures.every((lec) => isLabLecture(lec))

const isConsecutive = (first: TimetableSlot, second: TimetableSlot) =>
  first.endTimeHr === second.startTimeHr &&
  first.endTimeMinutes === second.startTimeMinutes

const canMergeLabSlots = (first: TimetableSlot, second: TimetableSlot) => {
  if (!isPureLabSlot(first) || !isPureLabSlot(second)) return false
  if (!isConsecutive(first, second)) return false

  const firstSet = slotLectureSignatureSet(first)
  const secondSet = slotLectureSignatureSet(second)
  if (!firstSet.size || !secondSet.size) return false
  if (firstSet.size !== secondSet.size) return false
  for (const sig of firstSet) {
    if (!secondSet.has(sig)) return false
  }
  return true
}

const mergeLectures = (first: TimetableLecture[], second: TimetableLecture[]) => {
  const merged = new Map<string, TimetableLecture>()
  for (const lecture of [...first, ...second]) {
    const key = lectureSignature(lecture)
    if (!merged.has(key)) merged.set(key, lecture)
  }
  return [...merged.values()]
}

export const collapseConsecutiveLabSlots = (slots: TimetableSlot[]) => {
  if (slots.length < 2) return [...slots]
  const ordered = [...slots].sort((a, b) => slotStartMinutes(a) - slotStartMinutes(b))
  const collapsed: TimetableSlot[] = []

  let i = 0
  while (i < ordered.length) {
    const current = ordered[i]
    if (i + 1 < ordered.length) {
      const next = ordered[i + 1]
      if (canMergeLabSlots(current, next)) {
        collapsed.push({
          ...current,
          endTimeHr: next.endTimeHr,
          endTimeMinutes: next.endTimeMinutes,
          lectures: mergeLectures(current.lectures, next.lectures),
        })
        i += 2
        continue
      }
    }
    collapsed.push(current)
    i += 1
  }

  return collapsed
}
