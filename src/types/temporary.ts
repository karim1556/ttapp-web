export interface TemporaryTimeSlot {
  id: number
  branch_id: number
  semester: number
  division: string
  date: string // ISO date string (YYYY-MM-DD)
  startTimeHr: number
  startTimeMinutes: number
  endTimeHr: number
  endTimeMinutes: number
  subjectCode?: string | null
  facultyid?: number | null
  room_number?: string | null
  typeOfLecture?: string | null
  eventName?: string | null
  description?: string | null
  createdBy?: number | null
  createdAt?: string
  updatedAt?: string

  // Enriched fields from database joins
  faculty_name?: string | null
  subject_name?: string | null
}

export interface TemporarySlotPayload {
  startTimeHr: number
  startTimeMinutes: number
  endTimeHr: number
  endTimeMinutes: number
  subjectCode: string
  facultyId?: number | null
  roomNumber?: string | null
}

export interface TemporaryBulkPayload {
  branchId: number
  sem: number
  division: string
  eventName?: string
  slots: TemporarySlotPayload[]
  date?: string
  fromDate?: string
  toDate?: string
}
