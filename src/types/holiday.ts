export interface Holiday {
  id: number
  date: string
  name: string
  type?: string | null
  description?: string | null
  academic_year?: string | null
  isToday?: boolean
}
