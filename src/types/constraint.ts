export interface UnavailableSlot {
  day: string
  startHour: number
  startMinutes: number
  endHour: number
  endMinutes: number
}

export interface PreferredSlot {
  day: string
  startHour: number
  startMinutes: number
  endHour: number
  endMinutes: number
}

export interface FacultyConstraint {
  id: number | null
  faculty_id: number
  max_lectures_per_day: number
  total_lectures_per_week: number
  unavailable_slots: UnavailableSlot[]
  preferred_slots: PreferredSlot[]
}
