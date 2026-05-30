export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

export type LectureType = 'Lecture' | 'Lab'

export interface TimetableLecture {
  id: number
  time_table_detailed_id?: number | null
  typeOfLecture?: LectureType | null
  subjectCode?: string | null
  subject_name?: string | null
  facultyid?: number | null
  faculty_name?: string | null
  batch?: string | null
  room_number?: string | null
  is_extra?: number | null
  reason?: string | null
}

export interface TimetableSlot {
  id: number
  timetable_id?: number | null
  startTimeHr?: number | null
  startTimeMinutes?: number | null
  endTimeHr?: number | null
  endTimeMinutes?: number | null
  lectures: TimetableLecture[]
}

export interface TimetableDay {
  id: number
  dateOfWeek?: DayOfWeek | null
  branch_id?: number | null
  sem?: string | null
  division?: string | null
  academic_id?: number | null
  fromDate?: string | null
  toDate?: string | null
  slots: TimetableSlot[]
}
