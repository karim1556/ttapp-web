export interface SubstitutionRecord {
  id: number
  lectureId: number
  slotId: number
  date: string
  dayName?: string | null
  originalFacultyId?: number | null
  originalFacultyName?: string | null
  substituteFacultyId?: number | null
  substituteFacultyName?: string | null
  subjectCode?: string | null
  subjectName?: string | null
  roomNumber?: string | null
  batch?: string | null
  lectureType?: string | null
  status: string
  reason?: string | null
  approvedBy?: number | null
  approvedAt?: string | null
  temporaryOnly?: boolean
  createdAt?: string | null
}
