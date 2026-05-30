export interface Subject {
  id: number
  subject_code: string
  subject_name?: string | null
  semester?: number | null
  branch_id?: number | null
  acad_year?: string | null
  weekly_hours?: number | null
  semester_hours?: number | null
  totalcredits?: number | null
  professor_assign?: string | null
  ispractical?: string | number | null
  isoral?: string | number | null
  max_marks?: number | null
  oral_marks?: number | null
  practical_marks?: number | null
  passing_marks?: number | null
  num_modules?: number | null
  num_experiments?: number | null
  num_assignments?: number | null
  experiments?: string | null
  theory?: string | null

  // Normalized fields returned by backend
  isPractical?: number | null
  isOral?: number | null
  totalCredits?: number | null
  weeklyHours?: number | null
  semesterHours?: number | null
  professorAssign?: string | null
}
