import type { SubstitutionRecord } from '../types/substitution'
import type { TimetableSlot } from '../types/timetable'

export const applyApprovedSubstitutions = (
  slots: TimetableSlot[],
  substitutions: SubstitutionRecord[],
  date: Date,
) => {
  if (!slots.length || !substitutions.length) return slots
  const dateKey = date.toISOString().slice(0, 10)
  const approved = new Map<number, SubstitutionRecord>()

  for (const record of substitutions) {
    if (record.status !== 'approved') continue
    if (record.date !== dateKey) continue
    if (record.lectureId) approved.set(record.lectureId, record)
  }

  if (!approved.size) return slots

  return slots.map((slot) => {
    if (!slot.lectures.length) return slot
    const lectures = slot.lectures.map((lecture) => {
      const record = approved.get(lecture.id)
      if (!record) return lecture
      return {
        ...lecture,
        facultyid: record.substituteFacultyId ?? lecture.facultyid,
        faculty_name: record.substituteFacultyName ?? lecture.faculty_name,
        reason: record.reason ?? lecture.reason,
      }
    })
    return { ...slot, lectures }
  })
}
