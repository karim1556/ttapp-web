export interface TimeSlotTemplate {
  id: number
  branch_id?: number | null
  semester?: number | null
  division?: string | null
  label?: string | null
  startTimeHr: number
  startTimeMinutes: number
  endTimeHr: number
  endTimeMinutes: number
  is_break?: number | null
  sort_order?: number | null
  is_active?: number | null
}
